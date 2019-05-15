import React, { useReducer, useState, useEffect } from 'react';
import { produce } from 'immer'
import './App.css';

// import { withAuthenticator } from 'aws-amplify-react'
import { Auth, API, graphqlOperation } from 'aws-amplify'
import { listTodos } from './graphql/queries'
import { ListTodosQuery } from './API'
import { GraphQLResult } from '@aws-amplify/api/lib/types';
import { NumericLiteral } from 'babel-types';
interface AuthType {
  readonly userName: string,
  readonly password: string,
  readonly email: string,
  readonly phone: string,
  readonly authCode: string,
  readonly step: number,
}

type StateField = 'userName' | 'password' | 'email' | 'phone' | 'authCode' | 'step'

const initState: AuthType = {
  userName: '',
  password: '',
  email: '',
  phone: '',
  authCode: '',
  step: 0
}

const authReducer = (prevState: AuthType, newState: Object): AuthType => {
  const spread = produce(Object.assign)
  return spread(prevState, newState)
}

const App: React.FC = () => {
  const [{ userName, password, email, phone, authCode, step }, setState] = useReducer(authReducer, initState)
  const [todos, setTodos] = useState()

  useEffect(() => {
    let didCancel = false

    async function fetchAPI() {
      const result = await API.graphql(graphqlOperation(listTodos))
      if (!didCancel) {
        // setTodos(result.data.listTodos.items)
        setTodos(result)
      }
    }

    fetchAPI()
    return () => {
      didCancel = true
    }
  }, [])

  const signUp = async () => {
    try {
      await Auth.signUp({ username: userName, password, attributes: { email, phone_number: phone } })
      console.log('Successfully signed up.')
      setState(initState)
      setState({ step: 1 })
    } catch (error) {
      console.error({ error })
    }
  }
  const confirmSignUp = async () => {
    try {
      await Auth.confirmSignUp(userName, authCode)
      console.log('Successfully confirmed.');
      setState(initState)
    } catch (error) {
      console.error({ error })
    }
  }

  const inputChange = (field: StateField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setState({ [field]: e.currentTarget.value })
  }

  return (
    <div className="App">
      <header className="App-header">
        {
          step === 0 ? <form onSubmit={e => { e.preventDefault(); signUp() }} >
            <input placeholder="name" type="text" onChange={inputChange('userName')} name="userName" value={userName} />
            <input placeholder="password" type="password" onChange={inputChange('password')} name="password" value={password} />
            <input placeholder="email" type="email" onChange={inputChange('email')} name="email" value={email} />
            <input placeholder="phone number" type="tel" onChange={inputChange('phone')} name="phoneNumber" value={phone} />
            <button type="submit">Sign Up</button>
          </form> :
            step === 1 ? <form onSubmit={e => { e.preventDefault(); confirmSignUp() }} >
              <input placeholder="name" type="text" onChange={inputChange('userName')} name="userName" value={userName} />
              <input placeholder="authentication code" type="text" onChange={inputChange('authCode')} name="authCode" value={authCode} />
              <button type="submit">Confirm</button>
            </form> :
              <form>

              </form>
        }
        <hr />
        <div>
          {/* <pre>{JSON.stringify(todos, null, 2)}</pre> */}
          <ul>
            {todos
              ? todos.data.listTodos.items.map(({ name, description, completed }: { name: string, description: string, completed: boolean }, index: number) => <li key={index} >{`${name}: ${description} => ${completed}`}</li>)
              : <li>Empty list</li>
            }
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App
// export default withAuthenticator(App, { includeGreetings: true })