CREATE TABLE "allowed_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "allowed_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "expense_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"remark" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" numeric NOT NULL,
	"uploaded_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expense_categories_code_unique" UNIQUE("code"),
	CONSTRAINT "expense_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"payment_method_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric NOT NULL,
	"expense_date" timestamp NOT NULL,
	"reference_number" text,
	"created_by_id" text NOT NULL,
	"updated_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by_id" text
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"shopify_product_id" text NOT NULL,
	"title" text NOT NULL,
	"sku" text,
	"inventory_quantity" numeric DEFAULT '0' NOT NULL,
	"price" numeric,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_shopify_product_id_unique" UNIQUE("shopify_product_id")
);
--> statement-breakpoint
CREATE TABLE "issue_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "issue_categories_code_unique" UNIQUE("code"),
	CONSTRAINT "issue_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "order_issue_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"issue_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"old_status" text,
	"new_status" text,
	"old_priority" text,
	"new_priority" text,
	"old_assigned_to_id" text,
	"new_assigned_to_id" text,
	"remark" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"category_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"assigned_to_id" text,
	"created_by_id" text NOT NULL,
	"resolved_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"shopify_product_id" text,
	"title" text,
	"quantity" numeric,
	"price" numeric,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"shopify_order_id" text NOT NULL,
	"order_number" text,
	"customer_name" text,
	"customer_email" text,
	"total_price" numeric,
	"currency" text,
	"created_at" timestamp DEFAULT now(),
	"financial_status" text,
	"fulfillment_status" text,
	CONSTRAINT "orders_shopify_order_id_unique" UNIQUE("shopify_order_id")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_active" text DEFAULT 'true',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_code_unique" UNIQUE("code"),
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" text PRIMARY KEY NOT NULL,
	"product_image" text,
	"buying_price" numeric NOT NULL,
	"stock_count" numeric NOT NULL,
	"selling_price" numeric NOT NULL,
	"product_id" text,
	"total_purchase_amount" numeric NOT NULL,
	"expected_return" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by_id" text NOT NULL,
	"updated_by_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text
);
--> statement-breakpoint
ALTER TABLE "expense_activities" ADD CONSTRAINT "expense_activities_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_activities" ADD CONSTRAINT "expense_activities_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_id_user_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issue_activities" ADD CONSTRAINT "order_issue_activities_issue_id_order_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."order_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issue_activities" ADD CONSTRAINT "order_issue_activities_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issue_activities" ADD CONSTRAINT "order_issue_activities_old_assigned_to_id_user_id_fk" FOREIGN KEY ("old_assigned_to_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issue_activities" ADD CONSTRAINT "order_issue_activities_new_assigned_to_id_user_id_fk" FOREIGN KEY ("new_assigned_to_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_category_id_issue_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."issue_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_assigned_to_id_user_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;