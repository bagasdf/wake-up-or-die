import { createHono } from "@/router/app";

import adminRouter from "./admin";
import articlesRouter from "./articles";
import badgesRouter from "./badges";
import calculatorRouter from "./calculator";
import certificatesRouter from "./certificates";
import chatRouter from "./chat";
import commentsRouter from "./comments";
import directoryRouter from "./directory";
import galleryRouter from "./gallery";
import homeRouter from "./home";
import meRouter from "./me";
import mediaRouter from "./media";
import quizzesRouter from "./quizzes";
import reportsRouter from "./reports";

export const router = createHono()
  .route("/home", homeRouter)
  .route("/articles", articlesRouter)
  .route("/comments", commentsRouter)
  .route("/quizzes", quizzesRouter)
  .route("/calculator", calculatorRouter)
  .route("/badges", badgesRouter)
  .route("/certificates", certificatesRouter)
  .route("/chat", chatRouter)
  .route("/directory", directoryRouter)
  .route("/reports", reportsRouter)
  .route("/gallery", galleryRouter)
  .route("/media", mediaRouter)
  .route("/me", meRouter)
  .route("/admin", adminRouter);

export type RouterRoutes = typeof router;
