-- CreateTable
CREATE TABLE "DriveUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,

    CONSTRAINT "DriveUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFederatedCredential" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DriveFederatedCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fileLink" TEXT,
    "sharedLink" TEXT,
    "sharedExpiry" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DriveFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriveUser_name_key" ON "DriveUser"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFederatedCredential_provider_subject_key" ON "DriveFederatedCredential"("provider", "subject");

-- AddForeignKey
ALTER TABLE "DriveFederatedCredential" ADD CONSTRAINT "DriveFederatedCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "DriveUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveFile" ADD CONSTRAINT "DriveFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "DriveUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
