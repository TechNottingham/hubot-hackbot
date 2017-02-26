import * as HttpClient from 'scoped-http-client'
import * as Yayson from 'yayson'
import { Robot } from 'hubot'

const Store = Yayson().Store

export interface ApiResponse {
  ok: boolean
  statusCode: number
}

interface User {
  id: string
  name: string
  team: Team
}

interface Team {
  id: string
  name: string
  members: User[]
  motto?: string
}

export interface UserResponse extends ApiResponse {
  user: User
}

export interface TeamResponse extends ApiResponse {
  team: Team
}

export interface TeamsResponse extends ApiResponse {
  teams: Team[]
}

export default class Client {
  private httpClient: HttpClient.ScopedClientConstructor

  constructor(private baseUrl: string, private hackbotPassword: string, robot?: Robot) {
    this.httpClient = robot ? robot.http.bind(robot) : HttpClient.create
  }

  public createTeam(teamName: string, userId: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      const body = JSON.stringify({
        data: {
          type: 'teams',
          attributes: {
            name: teamName,
          },
          relationships: {
            members: {
              data: [{
                type: 'users',
                id: userId,
              }],
            },
          },
        },
      })

      this.createClient('/teams', { auth: this.getAuth(auth) })
        .post(body)((err, res) => {
          if (err) {
            return reject(err)
          }

          resolve({
            ok: res.statusCode === 201,
            statusCode: res.statusCode,
          })
        })
    })
  }

  public removeTeam(teamId: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      this.createClient(`/teams/${teamId}`, { auth: this.getAuth(auth) })
        .delete('')((err, res) => {
          if (err) {
            return reject(err)
          }

          resolve({
            ok: res.statusCode === 204,
            statusCode: res.statusCode,
          })
        })
    })
  }

  public createUser(userId: string, userName: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      const body = JSON.stringify({
        data: {
          type: 'users',
          id: userId,
          attributes: {
            name: userName,
          },
        },
      })

      this.createClient('/users', { auth: this.getAuth(auth) })
        .post(body)((err, res) => {
          if (err) {
            return reject(err)
          }

          resolve({
            ok: res.statusCode === 201,
            statusCode: res.statusCode,
          })
        })
    })
  }

  public checkApi() {
    return new Promise<ApiResponse>((resolve, reject) => {
      this.httpClient(`${this.baseUrl}/api`)
        .get()((err, res) => {
          if (err) {
            return reject(err)
          }

          resolve({
            ok: res.statusCode === 200,
            statusCode: res.statusCode,
          })
        })
    })
  }

  public getUser(userId: string) {
    return new Promise<UserResponse>((resolve, reject) => {
      this.createClient(`/users/${userId}`)
        .get()((err, res, body) => {
          if (err) {
            return reject(err)
          }

          const result = {
            ok: res.statusCode === 200,
            statusCode: res.statusCode,
            user: <User> undefined,
          }

          if (result.ok) {
            const store = new Store()
            result.user = store.sync(JSON.parse(body))
          }

          resolve(result)
        })
    })
  }

  public getTeam(teamId: string) {
    return new Promise<TeamResponse>((resolve, reject) => {
      this.createClient(`/teams/${encodeURIComponent(teamId)}`)
        .get()((err, res, body) => {
          if (err) {
            return reject(err)
          }

          const result = {
            ok: res.statusCode === 200,
            statusCode: res.statusCode,
            team: <Team> undefined,
          }

          if (result.ok) {
            const store = new Store()
            result.team = store.sync(JSON.parse(body))
          }

          resolve(result)
        })
    })
  }

  public removeTeamMember(teamId: string, userId: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      const body = JSON.stringify({
        data: [{
          type: 'users',
          id: userId,
        }],
      })

      this.createClient(`/teams/${encodeURIComponent(teamId)}/members`, { auth: this.getAuth(auth) })
        .delete(body)((err, res) => {
          if (err) {
            return reject(err)
          }

          const result = {
            ok: res.statusCode === 204,
            statusCode: res.statusCode,
          }

          resolve(result)
        })
    })
  }

  public findTeams(filter: string) {
    return new Promise<TeamsResponse>((resolve, reject) => {
      this.createClient(`/teams?filter[name]=${encodeURIComponent(filter)}`)
        .get()((err, res, body) => {
          if (err) {
            return reject(err)
          }

          const result = {
            ok: res.statusCode === 200,
            statusCode: res.statusCode,
            teams: <Team[]> undefined,
          }

          if (result.ok) {
            const store = new Store()
            result.teams = store.sync(JSON.parse(body))
          }

          resolve(result)
        })
    })
  }

  public addUserToTeam(teamId: string, userId: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      const body = JSON.stringify({
        data: [{
          type: 'users',
          id: userId,
        }],
      })

      this.createClient(`/teams/${teamId}/members`, { auth: this.getAuth(auth) })
        .post(body)((err, res) => {
          if (err) {
            return reject(err)
          }

          const result = {
            ok: true,
            statusCode: res.statusCode,
          }

          resolve(result)
        })
    })
  }

  public updateMotto(teamMotto: string, teamId: string, auth: string) {
    return new Promise<ApiResponse>((resolve, reject) => {
      const body = JSON.stringify({
        data: {
          type: 'teams',
          id: teamId,
          attributes: {
            motto: teamMotto,
          },
        },
      })

      this.createClient(`/teams/${encodeURIComponent(teamId)}`, { auth: this.getAuth(auth) })
        .patch(body)((err, res) => {
          if (err) {
            return reject(err)
          }

          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
          })
        })
    })
  }

  private getAuth(auth: string) {
    return `${auth}:${this.hackbotPassword}`
  }

  private createClient(pathAndQuery: string, opts?: HttpClient.ClientOptions) {
    return this.httpClient(`${this.baseUrl}${pathAndQuery}`, opts)
      .header('Accept', 'application/vnd.api+json')
      .header('Content-Type', 'application/vnd.api+json')
  }
}
