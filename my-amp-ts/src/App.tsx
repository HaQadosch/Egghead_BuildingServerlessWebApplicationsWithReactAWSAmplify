import React, { useReducer, useState, useEffect } from 'react';
import { produce } from 'immer'
import './App.css';

import { withAuthenticator } from 'aws-amplify-react'
import { Auth, API, graphqlOperation, Storage } from 'aws-amplify'
import { listTodos } from './graphql/queries'

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
  const [people, setPeople] = useState([])
  const [fileS3, setFileS3] = useState<{ fileURL: string, fileName: string, file: File | string }>()

  useEffect(() => {
    let didCancel = false

    async function fetchAPI() {
      const result = await API.graphql(graphqlOperation(listTodos))
      if (!didCancel) {
        setTodos(result)
      }
    }

    async function fetchRestAPI() {
      const result = await API.get('people', '/people', {})
      if (!didCancel) {
        setPeople(result)
      }
    }

    fetchAPI()
    fetchRestAPI()
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

  const handleFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files ? evt.target.files[0] : null
    if (file) {
      setFileS3({
        fileURL: URL.createObjectURL(file),
        file,
        fileName: file.name
      })
    }
  }

  const saveFile = () => {
    if (fileS3) {
      Storage.put(fileS3.fileName, fileS3.file)
        .then(() => {
          console.log('File succesfully saved')
          setFileS3({
            fileName: '',
            file: '',
            fileURL: ''
          })
        })
        .catch(err => {
          console.log('oups: ', err)
        })
    }
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
          <ul>
            {todos
              ? todos.data.listTodos.items.map(({ name, description, completed }: { name: string, description: string, completed: boolean }, index: number) => <li key={index} >{`${name}: ${description} => ${completed}`}</li>)
              : <li>Empty list</li>
            }
          </ul>
        </div>
        <hr />
        <div>
          <pre>{JSON.stringify(people, null, 2)}</pre>
          {/* <ul>
            {people
              ? people.map(({ name, homeworld }: { name: string, homeworld: string }, index: number) => <li key={index} >{`${name}: ${homeworld} `}</li>)
              : <li>Empty list</li>
            }
          </ul> */}
        </div>
        <hr />
        <input type="file" name="fileS3" id="fileS3" onChange={handleFile} />
        <img src={fileS3 ? fileS3.fileURL : ''} alt="selected file" />
        <button onClick={saveFile} >Save file</button>
      </header>
    </div>
  );
}

// export default App
export default withAuthenticator(App, { includeGreetings: true })