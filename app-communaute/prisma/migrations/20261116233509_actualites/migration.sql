-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "categoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishAt" DATETIME,
    "expiresAt" DATETIME,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "coverMediaId" TEXT,
    "authorId" TEXT,
    "searchText" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsRead" (
    "newsId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("newsId", "userId"),
    CONSTRAINT "NewsRead_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "NewsItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_slug_key" ON "NewsItem"("slug");

-- CreateIndex
CREATE INDEX "NewsItem_status_publishAt_idx" ON "NewsItem"("status", "publishAt");

-- CreateIndex
CREATE INDEX "NewsRead_userId_idx" ON "NewsRead"("userId");
