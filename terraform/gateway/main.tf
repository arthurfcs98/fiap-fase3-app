data "aws_caller_identity" "current" {}

# Remote state dos outros repos
data "terraform_remote_state" "k8s" {
  backend = "s3"
  config = {
    bucket = var.tfstate_bucket
    key    = "infra-k8s/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "db" {
  backend = "s3"
  config = {
    bucket = var.tfstate_bucket
    key    = "infra-db/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "auth_lambda" {
  backend = "s3"
  config = {
    bucket = var.tfstate_bucket
    key    = "auth-lambda/terraform.tfstate"
    region = "us-east-1"
  }
}

data "aws_iam_role" "lambda_exec" {
  name = "LabRole"
}

# Descobre o ARN do NLB criado pelo Service do NGINX Ingress
data "aws_lbs" "nginx" {
  tags = {
    "kubernetes.io/service-name" = "ingress-nginx/ingress-nginx-controller"
  }
}

data "aws_lb" "nginx" {
  arn = tolist(data.aws_lbs.nginx.arns)[0]
}

data "aws_lb_listener" "nginx_http" {
  load_balancer_arn = data.aws_lb.nginx.arn
  port              = 80
}

# ===========================================================================
# Lambda Authorizer (valida JWT)
# ===========================================================================
data "archive_file" "authorizer_zip" {
  type        = "zip"
  source_file = "${path.module}/../../lambda-authorizer/dist/handler.js"
  output_path = "${path.module}/build/authorizer.zip"
}

resource "aws_cloudwatch_log_group" "authorizer" {
  name              = "/aws/lambda/fiap-fase3-authorizer"
  retention_in_days = 7
}

resource "aws_lambda_function" "authorizer" {
  function_name    = "fiap-fase3-authorizer"
  role             = data.aws_iam_role.lambda_exec.arn
  runtime          = "nodejs20.x"
  handler          = "handler.handler"
  filename         = data.archive_file.authorizer_zip.output_path
  source_code_hash = data.archive_file.authorizer_zip.output_base64sha256
  timeout          = 5
  memory_size      = 128
  architectures    = ["x86_64"]

  environment {
    variables = {
      JWT_SECRET_ARN = data.terraform_remote_state.db.outputs.jwt_secret_arn
      LOG_LEVEL      = "info"
    }
  }

  vpc_config {
    subnet_ids         = data.terraform_remote_state.k8s.outputs.subnet_ids
    security_group_ids = [aws_security_group.authorizer.id]
  }

  depends_on = [aws_cloudwatch_log_group.authorizer]
}

resource "aws_security_group" "authorizer" {
  name        = "fiap-fase3-authorizer-sg"
  description = "Egress for authorizer Lambda (Secrets Manager via VPCE)"
  vpc_id      = data.terraform_remote_state.k8s.outputs.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ===========================================================================
# HTTP API
# ===========================================================================
resource "aws_apigatewayv2_api" "main" {
  name          = var.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins  = ["*"]
    allow_methods  = ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    allow_headers  = ["content-type", "authorization", "x-correlation-id"]
    expose_headers = ["x-correlation-id"]
    max_age        = 86400
  }
}

resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/aws/apigateway/fiap-fase3"
  retention_in_days = 7
}

# Stages: homolog e prod
resource "aws_apigatewayv2_stage" "homolog" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "homolog"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "prod"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

# ===========================================================================
# Integração 1: Lambda Auth (POST /auth)
# ===========================================================================
resource "aws_apigatewayv2_integration" "auth_lambda" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = data.terraform_remote_state.auth_lambda.outputs.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth"
  target    = "integrations/${aws_apigatewayv2_integration.auth_lambda.id}"
}

resource "aws_lambda_permission" "auth_invoke" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = data.terraform_remote_state.auth_lambda.outputs.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ===========================================================================
# Integração 2: API NestJS via VPC Link → NLB do NGINX
# ===========================================================================
resource "aws_security_group" "vpclink" {
  name        = "fiap-fase3-vpclink-sg"
  description = "VPC Link egress to NLB"
  vpc_id      = data.terraform_remote_state.k8s.outputs.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "fiap-fase3-vpclink"
  subnet_ids         = data.terraform_remote_state.k8s.outputs.subnet_ids
  security_group_ids = [aws_security_group.vpclink.id]
}

resource "aws_apigatewayv2_integration" "app_eks" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "HTTP_PROXY"
  integration_uri        = data.aws_lb_listener.nginx_http.arn
  integration_method     = "ANY"
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.main.id
  payload_format_version = "1.0"
}

# ===========================================================================
# Authorizer JWT (consome Lambda Authorizer)
# ===========================================================================
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id                            = aws_apigatewayv2_api.main.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer.invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "jwt-authorizer"
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  authorizer_result_ttl_in_seconds  = 60
}

resource "aws_lambda_permission" "authorizer_invoke" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.jwt.id}"
}

# ===========================================================================
# Rotas protegidas: ANY /api/{proxy+}
# ===========================================================================
resource "aws_apigatewayv2_route" "api_protected" {
  for_each = toset(["GET", "POST", "PATCH", "PUT", "DELETE"])

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "${each.key} /api/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.app_eks.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

# Rotas públicas: health e docs (sem authorizer)
resource "aws_apigatewayv2_route" "public_health" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.app_eks.id}"
}

resource "aws_apigatewayv2_route" "public_docs" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/docs"
  target    = "integrations/${aws_apigatewayv2_integration.app_eks.id}"
}

resource "aws_apigatewayv2_route" "public_docs_proxy" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /api/docs/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.app_eks.id}"
}
