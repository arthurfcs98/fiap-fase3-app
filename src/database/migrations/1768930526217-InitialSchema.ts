import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1768930526217 implements MigrationInterface {
    name = 'InitialSchema1768930526217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "document" character varying NOT NULL, "document_type" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "street" character varying, "number" character varying, "complement" character varying, "neighborhood" character varying, "city" character varying, "state" character varying, "zip_code" character varying, CONSTRAINT "UQ_68c9c024a07c49ad6a2072d23c6" UNIQUE ("document"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "code" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "base_price" numeric(10,2) NOT NULL, "estimated_minutes" integer NOT NULL, CONSTRAINT "UQ_f019a17cb439406ab185382df9b" UNIQUE ("code"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "service_order_id" uuid NOT NULL, "service_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_6f33fec247bbbd740b40886b962" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "parts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "code" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "unit_price" numeric(10,2) NOT NULL, "stock_quantity" integer NOT NULL DEFAULT '0', "reserved_quantity" integer NOT NULL DEFAULT '0', "minimum_stock" integer NOT NULL DEFAULT '0', "manufacturer" character varying, CONSTRAINT "UQ_53a67950870596e39ae1e75551a" UNIQUE ("code"), CONSTRAINT "PK_daa5595bb8933f49ac00c9ebc79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_order_parts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "service_order_id" uuid NOT NULL, "part_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_62d9d1b9e2eef354eb67da50927" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_orders_status_enum" AS ENUM('RECEIVED', 'IN_DIAGNOSIS', 'AWAITING_APPROVAL', 'AWAITING_START', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "service_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "order_number" character varying NOT NULL, "customer_id" uuid NOT NULL, "vehicle_id" uuid NOT NULL, "status" "public"."service_orders_status_enum" NOT NULL DEFAULT 'RECEIVED', "total_amount" numeric(10,2) NOT NULL DEFAULT '0', "observations" text, "diagnosis_notes" text, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_662d9c1a5393365361ef59b7d27" UNIQUE ("order_number"), CONSTRAINT "PK_914aa74962ee83b10614ea2095d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "license_plate" character varying NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "color" character varying, "customer_id" uuid NOT NULL, CONSTRAINT "UQ_7e9fab2e8625b63613f67bd706c" UNIQUE ("license_plate"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_order_status_history_from_status_enum" AS ENUM('RECEIVED', 'IN_DIAGNOSIS', 'AWAITING_APPROVAL', 'AWAITING_START', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."service_order_status_history_to_status_enum" AS ENUM('RECEIVED', 'IN_DIAGNOSIS', 'AWAITING_APPROVAL', 'AWAITING_START', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "service_order_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "service_order_id" uuid NOT NULL, "from_status" "public"."service_order_status_history_from_status_enum", "to_status" "public"."service_order_status_history_to_status_enum" NOT NULL, "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "changed_by" uuid, "notes" text, CONSTRAINT "PK_51fca5776275830abc2aa961a8a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_movement_type_enum" AS ENUM('IN', 'OUT', 'RESERVE', 'RELEASE', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "part_id" uuid NOT NULL, "service_order_id" uuid, "movement_type" "public"."stock_movements_movement_type_enum" NOT NULL, "quantity" integer NOT NULL, "previous_stock" integer NOT NULL, "new_stock" integer NOT NULL, "previous_reserved" integer NOT NULL DEFAULT '0', "new_reserved" integer NOT NULL DEFAULT '0', "reference" character varying, "notes" text, "created_by" uuid, CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "service_order_items" ADD CONSTRAINT "FK_e4472d1d912bb7be07fe4eeed27" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_order_items" ADD CONSTRAINT "FK_34fcf31d3f22087401005ddbc01" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_order_parts" ADD CONSTRAINT "FK_2fc212508d9324e30867d480295" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_order_parts" ADD CONSTRAINT "FK_e036529541d2679d70dd99e1618" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_orders" ADD CONSTRAINT "FK_2560471c48d4fcafc50ad885af7" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_orders" ADD CONSTRAINT "FK_8fdf4cfc8268dfa8a22023a6e7e" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_order_status_history" ADD CONSTRAINT "FK_a772bd8c76cc0c244bac52ff720" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_f97a2ef8af9e019a28dba407c98" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_f97a2ef8af9e019a28dba407c98"`);
        await queryRunner.query(`ALTER TABLE "service_order_status_history" DROP CONSTRAINT "FK_a772bd8c76cc0c244bac52ff720"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627"`);
        await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_8fdf4cfc8268dfa8a22023a6e7e"`);
        await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_2560471c48d4fcafc50ad885af7"`);
        await queryRunner.query(`ALTER TABLE "service_order_parts" DROP CONSTRAINT "FK_e036529541d2679d70dd99e1618"`);
        await queryRunner.query(`ALTER TABLE "service_order_parts" DROP CONSTRAINT "FK_2fc212508d9324e30867d480295"`);
        await queryRunner.query(`ALTER TABLE "service_order_items" DROP CONSTRAINT "FK_34fcf31d3f22087401005ddbc01"`);
        await queryRunner.query(`ALTER TABLE "service_order_items" DROP CONSTRAINT "FK_e4472d1d912bb7be07fe4eeed27"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_movement_type_enum"`);
        await queryRunner.query(`DROP TABLE "service_order_status_history"`);
        await queryRunner.query(`DROP TYPE "public"."service_order_status_history_to_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."service_order_status_history_from_status_enum"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "service_orders"`);
        await queryRunner.query(`DROP TYPE "public"."service_orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "service_order_parts"`);
        await queryRunner.query(`DROP TABLE "parts"`);
        await queryRunner.query(`DROP TABLE "service_order_items"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
