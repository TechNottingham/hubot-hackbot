import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot tell me about team X', () => {

  let helper: Helper.Helper
  let room: Helper.Room
  let robot: RobotWithClient
  let dataStore: MemoryDataStore

  before(() => helper = new Helper('../index.js'))

  function setUp() {
    room = helper.createRoom()
    robot = <RobotWithClient> room.robot
    dataStore = new MemoryDataStore()
    robot.adapter.client = <SlackBotClient> { rtm: { dataStore: dataStore } }
  }

  function tearDown() {
    room.destroy()
  }

  describe('when team exists with members and a motto', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { name: firstTeamMember } = random.user()
    const { name: secondTeamMember } = random.user()
    const { id: teamId, name: teamName } = random.team()
    const motto = random.motto()
    let getTeamStub: sinon.SinonStub

    before(() => {
      getTeamStub = sinon.stub(robot.client, 'getTeam')
        .returns(Promise.resolve({
          ok: true,
          team: {
            id: teamId,
            name: teamName,
            motto: motto,
            members: [{
              name: firstTeamMember,
            }, {
              name: secondTeamMember,
            }],
          },
        }))

      return room.user.say(userName, `@hubot tell me about team     ${teamName}         `)
    })

    it('should fetch the team by slug (teamid)', () => {
      expect(getTeamStub).to.have.been.calledWith(teamId)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName}         `],
        ['hubot', `@${userName} "${teamName}" has 2 members: ${firstTeamMember}, ${secondTeamMember}\r\nThey say: ${motto}`],
      ])
    })
  })

  describe('when team exists with one member and no motto', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamMemberId, name: teamMemberName } = random.user()
    const { id: teamId, name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getTeam')
        .withArgs(teamId)
        .returns(Promise.resolve({
          ok: true,
          team: {
            name: teamName,
            motto: null,
            members: [{
              id: teamMemberId,
              name: teamMemberName,
            }],
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about team     ${teamName}         `)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName}         `],
        ['hubot', `@${userName} "${teamName}" has 1 member: ${teamMemberName}\r\nThey don't yet have a motto!`],
      ])
    })
  })

  describe('when team exists with the user as the only member and a motto', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()
    const motto = random.motto()

    before(() => {
      sinon.stub(robot.client, 'getTeam')
        .withArgs(teamId)
        .returns(Promise.resolve({
          ok: true,
          team: {
            name: teamName,
            motto: motto,
            members: [{
              id: userId,
              name: userName,
            }],
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about team     ${teamName}         `)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName}         `],
        ['hubot', `@${userName} You are the only member of "${teamName}" and your motto is: ${motto}`],
      ])
    })
  })

  describe('when team exists with the user as the only member and no motto', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getTeam')
        .withArgs(teamId)
        .returns(Promise.resolve({
          ok: true,
          team: {
            name: teamName,
            motto: null,
            members: [{
              id: userId,
              name: userName,
            }],
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about team     ${teamName}         `)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName}         `],
        ['hubot', `@${userName} You are the only member of "${teamName}" and you have not yet set your motto!`],
      ])
    })
  })

  describe('when team exists with no members', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()
    let getTeamStub: sinon.SinonStub

    before(() => {
      getTeamStub = sinon.stub(robot.client, 'getTeam')
        .withArgs(teamId)
        .returns(Promise.resolve({
          ok: true,
          team: {
            id: teamId,
            name: teamName,
            members: [],
          },
        }))

      return room.user.say(userName, `@hubot tell me about team     ${teamName.toUpperCase()}         `)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName.toUpperCase()}         `],
        ['hubot', `@${userName} "${teamName}" is an empty team.`],
      ])
    })
  })

  describe('when team does not exist', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getTeam')
        .withArgs(teamId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 404,
        }))

      return room.user.say(userName, `@hubot tell me about team  ${teamName}`)
    })

    it('should tell the user the team does not exist', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team  ${teamName}`],
        ['hubot', `@${userName} Sorry, I can't find that team.`],
      ])
    })
  })

  describe('when get team fails', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getTeam').withArgs(teamId).returns(Promise.resolve({ ok: false }))

      return room.user.say(userName, `@hubot tell me about team     ${teamName}         `)
    })

    it('should tell the user that there is a problem', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about team     ${teamName}         `],
        ['hubot', `@${userName} Sorry, there was a problem when I tried to look up that team :frowning:`],
      ])
    })
  })
})
