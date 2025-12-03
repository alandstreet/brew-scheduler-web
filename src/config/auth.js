export const authConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_hyHAlZnZv',
      userPoolClientId: 'djs4o25tq4q0qmramo44tji2t',
      loginWith: {
        oauth: {
          domain: 'ap-southeast-2hyhalznzv.auth.ap-southeast-2.amazoncognito.com',
          scopes: ['openid', 'email', 'phone'],
          // redirectSignIn: ['http://localhost:9000/brew-scheduler-web/'],
          // redirectSignOut: ['http://localhost:9000/brew-scheduler-web/'],
          redirectSignIn: ['https://alandstreet.github.io/brew-scheduler-web/'],
          redirectSignOut: ['https://alandstreet.github.io/brew-scheduler-web/'],
          responseType: 'code'
        }
      }
    }
  }
}
