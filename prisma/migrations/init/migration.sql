-- CreateTable
CREATE TABLE "club_codes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,

    CONSTRAINT "club_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_federated_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "provider" VARCHAR(100),
    "subject" VARCHAR(255),

    CONSTRAINT "club_federated_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_posts" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT timezone('UTC'::text, now()),

    CONSTRAINT "club_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "password" VARCHAR(100),
    "is_admin" BOOLEAN DEFAULT false,
    "is_club_member" BOOLEAN DEFAULT false,

    CONSTRAINT "club_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "departs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miniboard" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "text" VARCHAR(255),
    "author" VARCHAR(255),
    "dt" TIMESTAMP(6) DEFAULT (now() AT TIME ZONE 'UTC'::text),

    CONSTRAINT "miniboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nationalities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "depart_id" INTEGER,
    "nationality_id" INTEGER,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_codes_name_key" ON "club_codes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "club_federated_credentials_provider_subject_key" ON "club_federated_credentials"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "club_users_email_key" ON "club_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departs_name_key" ON "departs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_name_key" ON "nationalities"("name");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "club_federated_credentials" ADD CONSTRAINT "club_federated_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "club_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "club_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_depart_id_fkey" FOREIGN KEY ("depart_id") REFERENCES "departs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_nationality_id_fkey" FOREIGN KEY ("nationality_id") REFERENCES "nationalities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

