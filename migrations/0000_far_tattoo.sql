CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"lab_name" text NOT NULL,
	"purchase_date" date NOT NULL,
	"original_cost" numeric NOT NULL,
	"depreciation_rate" numeric NOT NULL,
	"useful_life" integer NOT NULL,
	"functional_status" text NOT NULL,
	"approval_status" text NOT NULL,
	CONSTRAINT "inventory_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"otp" text NOT NULL,
	"registration_data" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "otp_verifications_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"generated_by" integer NOT NULL,
	"date" timestamp DEFAULT now(),
	"functional_status" text NOT NULL,
	"recommendation" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'Pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"reason" text NOT NULL,
	"lab_name" text NOT NULL,
	"priority" text NOT NULL,
	"status" text DEFAULT 'Requested' NOT NULL,
	"requested_by" integer NOT NULL,
	"date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"age" integer,
	"gender" text,
	"employee_id" text,
	"contact_number" text,
	"date_of_joining" date,
	"profile_image" text,
	"department" text DEFAULT 'Department of Computer Engineering, University Polytechnic',
	"institution" text DEFAULT 'Jamia Millia Islamia',
	"is_approved" text DEFAULT 'false' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
