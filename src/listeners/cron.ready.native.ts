// system file, please don't modify it

import * as app from "#app"
import logger from "#logger"

/**
 * See the {@link https://ghom.gitbook.io/bot.ts/usage/create-a-listener listener guide} for more information.
 */
export default new app.Listener({
  event: "ready",
  description: "Launch all cron jobs",
  async run() {
    let launched = 0

    for (const cron of app.cronList.values()) {
      try {
        cron.start()
        launched++
      } catch (error) {
        if (typeof error === "string" || error instanceof Error)
          logger.error(error, cron.filepath, true)
        else
          logger.error(
            "an error occurred while starting the cron job",
            cron.filepath,
          )
      }
    }

    if (launched > 0) {
      logger.log(`launched ${launched} cron jobs`)
      if (app.cronList.size > launched)
        logger.error(
          `failed to launch ${app.cronList.size - launched} cron jobs`,
        )
    } else if (app.cronList.size > 0)
      logger.log("failed to launch any cron jobs")
  },
})