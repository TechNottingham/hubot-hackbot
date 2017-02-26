import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot find teams like X', () => {

  let helper: Helper.Helper
  let room: Helper.Room
  let robot: RobotWithClient

  before(() => helper = new Helper('../index.js'))

  function setUp() {
    room = helper.createRoom()
    robot = <RobotWithClient> room.robot
  }

  function tearDown() {
    room.destroy()
  }

  describe('when matching teams found', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    let findTeamsStub: sinon.SinonStub

    before(() => {
      findTeamsStub = sinon.stub(robot.client, 'findTeams')
        .returns(Promise.resolve({
          ok: true,
          teams: [
            { name: 'Hack Hackers Hacking Hacks' },
            { name: 'Hackers Hacking Hack Hacks' },
            { name: 'Another Team' },
            { name: 'b' },
          ],
        }))

      return room.user.say(userName, '@hubot find teams like hacking hack')
    })

    it('should find teams matching the search', () => {
      expect(findTeamsStub).to.have.been.calledWith('hacking hack')
    })

    it('should tell the user which teams were found', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot find teams like hacking hack'],
        ['hubot', `@${userName} Found 4 teams; here's a few: Hack Hackers Hacking Hacks, Hackers Hacking Hack Hacks, Another Team`],
      ])
    })
  })

  describe('when no matching teams found', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()

    before(() => {
      sinon.stub(robot.client, 'findTeams').returns(Promise.resolve({
        ok: true,
        teams: [],
      }))

      return room.user.say(userName, '@hubot find teams like hacking hack')
    })

    it('should tell the user that no teams were found', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot find teams like hacking hack'],
        ['hubot', `@${userName} None found.`],
      ])
    })
  })
})
