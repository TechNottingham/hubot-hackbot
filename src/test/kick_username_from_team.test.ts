import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'

describe('@hubot kick @username from my team', () => {

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

  describe('when in a team', () => {

    before(setUp)
    after(tearDown)

    let userName: string
    let userEmail: string
    let otherUserId: string
    let otherUsername: string
    let teamId: string
    let teamName: string
    let getUserStub: sinon.SinonStub
    let removeTeamMemberStub: sinon.SinonStub

    before(() => {
      userName = 'micah'
      userEmail = 'micah.micah~micah'
      otherUserId = 'polly'
      otherUsername = 'abcdefghijklmnopqrstuvwxyz.-_0123456789'
      teamId = 'ocean-mongrels'
      teamName = 'Ocean Mongrels'

      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userName)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember')
        .withArgs(teamId, otherUserId, userEmail)
        .returns(Promise.resolve({ok: true}))

      sinon.stub(dataStore, 'getUserById')
        .withArgs(userName)
        .returns({ id: userName, profile: { email: userEmail } } as User)
      sinon.stub(dataStore, 'getUserByName')
        .withArgs(otherUsername)
        .returns({ id: otherUserId, name: otherUsername } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should get the current user', () => {
      expect(getUserStub).to.have.been.calledWith(userName)
    })

    it('should remove the user from the team', () => {
      expect(removeTeamMemberStub).to.have.been.calledWith(teamId, otherUserId, userEmail)
    })

    it('should tell the user that the command has completed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} Done!`],
      ])
    })
  })

  describe('when not in a team', () => {

    before(setUp)
    after(tearDown)

    let userName: string
    let userEmail: string
    let otherUsername: string
    let getUserStub: sinon.SinonStub
    let removeTeamMemberStub: sinon.SinonStub

    before(() => {
      userName = 'micah'
      userEmail = 'micah.micah-micah'
      otherUsername = 'grkkghekhkurre'

      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userName)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember')

      sinon.stub(dataStore, 'getUserById')
        .withArgs(userName)
        .returns({ id: userName, profile: { email: userEmail } } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should get the current user', () => {
      expect(getUserStub).to.have.been.calledWith(userName)
    })

    it('should not remove the user from the team', () => {
      expect(removeTeamMemberStub).to.not.have.been.called
    })

    it('should tell the user that the command has failed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} I would, but you're not in a team...`],
      ])
    })
  })

})
