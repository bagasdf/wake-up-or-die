import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { account, session, user, verification } from "./auth-schema";

export * from "./auth-schema";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export type PublishStatus = "draft" | "published" | "archived";
export type ArticleCategory = "jenis" | "dampak" | "pencegahan" | "hukum" | "umum";
export type CommentStatus = "pending" | "approved" | "rejected";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type ReportCategory = "konsultasi" | "pengaduan";
export type ReportStatus = "new" | "in_review" | "resolved" | "closed";
export type ReportPriority = "low" | "normal" | "high" | "urgent";
export type MediaType = "poster" | "infografis" | "video" | "lainnya";
export type ContactCategory = "darurat" | "bnn" | "rehabilitasi" | "hotline" | "lainnya";
export type ChatRole = "system" | "user" | "assistant";
export type CertificateType = "quiz" | "series";

const articles = pgTable(
  "articles",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    content: text("content").notNull(),
    coverImageUrl: text("cover_image_url"),
    category: text("category").$type<ArticleCategory>().default("umum").notNull(),
    seriesSlug: text("series_slug"),
    seriesOrder: integer("series_order").default(0).notNull(),
    status: text("status").$type<PublishStatus>().default("draft").notNull(),
    readingMinutes: integer("reading_minutes").default(5).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("articles_status_published_idx").on(t.status, t.publishedAt),
    index("articles_category_idx").on(t.category),
    index("articles_series_idx").on(t.seriesSlug, t.seriesOrder),
  ],
);

const articleReads = pgTable(
  "article_reads",
  {
    id: id(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("article_reads_article_user_uq").on(t.articleId, t.userId)],
);

const comments = pgTable(
  "comments",
  {
    id: id(),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    status: text("status").$type<CommentStatus>().default("pending").notNull(),
    parentId: text("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    moderatedBy: text("moderated_by").references(() => user.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("comments_article_status_idx").on(t.articleId, t.status),
    index("comments_parent_idx").on(t.parentId),
  ],
);

const quizzes = pgTable(
  "quizzes",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    difficulty: text("difficulty").$type<QuizDifficulty>().default("easy").notNull(),
    status: text("status").$type<PublishStatus>().default("draft").notNull(),
    passScore: integer("pass_score").default(70).notNull(),
    timeLimitSeconds: integer("time_limit_seconds"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("quizzes_status_idx").on(t.status)],
);

const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: id(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    explanation: text("explanation"),
    position: integer("position").default(0).notNull(),
  },
  (t) => [index("quiz_questions_quiz_idx").on(t.quizId, t.position)],
);

const quizOptions = pgTable(
  "quiz_options",
  {
    id: id(),
    questionId: text("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    isCorrect: boolean("is_correct").default(false).notNull(),
    position: integer("position").default(0).notNull(),
  },
  (t) => [index("quiz_options_question_idx").on(t.questionId, t.position)],
);

const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: id(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionKey: text("session_key"),
    score: integer("score").default(0).notNull(),
    correctCount: integer("correct_count").default(0).notNull(),
    totalQuestions: integer("total_questions").default(0).notNull(),
    passed: boolean("passed").default(false).notNull(),
    answers: jsonb("answers")
      .$type<Array<{ questionId: string; optionId: string; correct: boolean }>>()
      .default([])
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("quiz_attempts_user_idx").on(t.userId, t.completedAt),
    index("quiz_attempts_quiz_idx").on(t.quizId),
  ],
);

const badges = pgTable("badges", {
  id: id(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").default("🏅").notNull(),
  points: integer("points").default(0).notNull(),
  criteria: jsonb("criteria")
    .$type<{ type: "quizzes_passed" | "articles_read" | "points" | "comments"; gte: number }>()
    .notNull(),
  createdAt: createdAt(),
});

const userBadges = pgTable(
  "user_badges",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("user_badges_user_badge_uq").on(t.userId, t.badgeId)],
);

const pointEvents = pgTable(
  "point_events",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    points: integer("points").notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("point_events_user_idx").on(t.userId, t.createdAt),
    uniqueIndex("point_events_unique_award_uq").on(t.userId, t.action, t.refType, t.refId),
  ],
);

const certificates = pgTable(
  "certificates",
  {
    id: id(),
    code: text("code").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<CertificateType>().notNull(),
    refId: text("ref_id").notNull(),
    title: text("title").notNull(),
    recipientName: text("recipient_name").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  },
  (t) => [uniqueIndex("certificates_user_ref_uq").on(t.userId, t.type, t.refId)],
);

const helpContacts = pgTable(
  "help_contacts",
  {
    id: id(),
    name: text("name").notNull(),
    organization: text("organization"),
    category: text("category").$type<ContactCategory>().default("hotline").notNull(),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    address: text("address"),
    city: text("city"),
    province: text("province"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    operatingHours: text("operating_hours"),
    is24h: boolean("is_24h").default(false).notNull(),
    isVerified: boolean("is_verified").default(true).notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("help_contacts_category_idx").on(t.category, t.position)],
);

const reports = pgTable(
  "reports",
  {
    id: id(),
    ticketCode: text("ticket_code").notNull().unique(),
    category: text("category").$type<ReportCategory>().default("konsultasi").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    contactMethod: text("contact_method"),
    contactValue: text("contact_value"),
    status: text("status").$type<ReportStatus>().default("new").notNull(),
    priority: text("priority").$type<ReportPriority>().default("normal").notNull(),
    adminNotes: text("admin_notes"),
    handledBy: text("handled_by").references(() => user.id, { onDelete: "set null" }),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("reports_status_idx").on(t.status, t.createdAt)],
);

const mediaAssets = pgTable(
  "media_assets",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").$type<MediaType>().default("poster").notNull(),
    fileKey: text("file_key"),
    url: text("url"),
    thumbnailUrl: text("thumbnail_url"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    downloadCount: integer("download_count").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("media_assets_type_idx").on(t.type, t.isPublished)],
);

const chatConversations = pgTable(
  "chat_conversations",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionKey: text("session_key"),
    title: text("title").default("Konsultasi baru").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("chat_conversations_owner_idx").on(t.userId, t.sessionKey)],
);

const chatMessages = pgTable(
  "chat_messages",
  {
    id: id(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").$type<ChatRole>().notNull(),
    content: text("content").notNull(),
    model: text("model"),
    createdAt: createdAt(),
  },
  (t) => [index("chat_messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

const calculatorResults = pgTable(
  "calculator_results",
  {
    id: id(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionKey: text("session_key"),
    input: jsonb("input").$type<Record<string, unknown>>().notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("calculator_results_user_idx").on(t.userId, t.createdAt)],
);

const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

export {
  account,
  articleReads,
  articles,
  badges,
  calculatorResults,
  certificates,
  chatConversations,
  chatMessages,
  comments,
  helpContacts,
  mediaAssets,
  pointEvents,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
  reports,
  session,
  siteSettings,
  user,
  userBadges,
  verification,
};
