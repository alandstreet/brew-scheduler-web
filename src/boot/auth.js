import { Amplify } from 'aws-amplify'
import { authConfig } from 'src/config/auth'

export default () => {
  Amplify.configure(authConfig)
}
