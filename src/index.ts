// Description:
//   Self service team and user administration scripts.
//
// Configuration:
//   HACKBOT_PASSWORD: required
//   HACK24API_URL: required
//
// Commands:
//   hubot can you see the api? - checks if the API is visible
//   hubot what are your prime directives? - cites hubot's prime directives
//   hubot my id - echos the ID hubot knows you as
//   hubot create team <team name> - tries to create team with name <team name> and adds you to it
//   hubot leave my team - removes you from your current team
//   hubot find teams like <query> - displays up to three teams matching the specified query
//   hubot tell me about team <team name> - displays information about the specific team
//   hubot add @<username> to my team - adds @<username> to your team
//   hubot tell me about my team - displays information about your team
//
// Author:
//   David Wood <david.p.wood@gmail.com>
//

import Client from './client'
import { RobotWithClient } from './hackbot'
import Config, { loadConfig } from './config'
import { AugmentRobot, AugmentedRobot } from './augmented_robot'

import ErrorScript from './scripts/error.script'

import AddUsernameToMyTeamScript from './scripts/add_username_to_my_team.script'
import CanYouSeeTheApiScript from './scripts/can_you_see_the_api.script'
import CreateTeamScript from './scripts/create_team.script'
import FindTeamsLikeScript from './scripts/find_teams_like.script'
import KickUsernameFromTeamScript from './scripts/kick_username_from_team.script'
import LeaveMyTeamScript from './scripts/leave_my_team.script'
import MyIdScript from './scripts/my_id.script'
import OurMottoIsScript from './scripts/our_motto_is.script'
import PrimeDirectivesScript from './scripts/prime_directives.script'
import TellMeAboutMyTeamScript from './scripts/tell_me_about_my_team.script'
import TellMeAboutTeamScript from './scripts/tell_me_about_team.script'
import TellMeAboutUsername from './scripts/tell_me_about_username.script'
import OkHackbot from './scripts/ok_hackbot.script'

function load(robot: RobotWithClient) {
  loadConfig(robot.logger.error.bind(robot.logger))

  robot.logger.debug(`HACKBOT_ERROR_CHANNEL set to ${Config.HACKBOT_ERROR_CHANNEL.value}`)
  robot.logger.debug(`HACKBOT_API_URL set to ${Config.HACKBOT_API_URL.value}`)

  robot.client = new Client(Config.HACKBOT_API_URL.value, Config.HACKBOT_API_PASSWORD.value, robot)

  ErrorScript(robot)

  const augmentedRobot: AugmentedRobot = AugmentRobot(robot)

  AddUsernameToMyTeamScript(augmentedRobot)
  CanYouSeeTheApiScript(augmentedRobot)
  CreateTeamScript(augmentedRobot)
  FindTeamsLikeScript(augmentedRobot)
  KickUsernameFromTeamScript(augmentedRobot)
  LeaveMyTeamScript(augmentedRobot)
  MyIdScript(robot)
  OurMottoIsScript(augmentedRobot)
  PrimeDirectivesScript(robot)
  TellMeAboutMyTeamScript(augmentedRobot)
  TellMeAboutTeamScript(augmentedRobot)
  TellMeAboutUsername(augmentedRobot)
  OkHackbot(augmentedRobot)
}

export = load
