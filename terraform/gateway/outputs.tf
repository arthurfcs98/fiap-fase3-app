output "api_endpoint_homolog" {
  description = "Endpoint do stage homolog"
  value       = aws_apigatewayv2_stage.homolog.invoke_url
}

output "api_endpoint_prod" {
  description = "Endpoint do stage prod"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "authorizer_arn" {
  value = aws_lambda_function.authorizer.arn
}
