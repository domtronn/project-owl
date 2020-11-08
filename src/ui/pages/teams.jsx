import * as React from 'react'

import { firebase } from '../../common/firebase'
import 'firebase/firestore'

import { Button } from '../../common/components/button'
import { Checkbox } from '../../common/components/checkbox'

export default ({ user }) => {
  const [teams, setTeams] = React.useState([])
  const [selectedTeams, setSelectedTeams] = React.useState([])

  React.useEffect(() => {
    (
      async () => {
        const teamsRef = await firebase
              .firestore()
              .collection('/teams')
              .get()

        const res = []
        teamsRef.forEach(ref => res.push({ id: ref.id, ...ref.data()}))
        setTeams(res)
      }
    )()
  }, [])

  return (
    <>
      <h5>Join a team</h5>
      <p>
        We found the following teams
        <br /> for you to join
      </p>

      <form
        style={{ textAlign: 'left' }}
        onSubmit={e => {
          e.preventDefault()
          selectedTeams.forEach(id => {
            firebase
              .firestore()
              .collection('/teams')
              .doc(id)
              .set({
                members: {
                  [user.uid]: true
                }
              }, { merge: true })
          })
        }}
      >
        {
          teams.map(({ name, members = {}, id }, i) => (
            <Checkbox
              style={{ margin: '16px 0' }}
              onChange={_ => {
                setSelectedTeams(
                  selectedTeams.includes(id)
                    ? selectedTeams.filter(i => i !== id)
                    : selectedTeams.concat(id)
                )
              }}
              checked={selectedTeams.includes(id)}
              key={`${name}--${i}`}
            >
              <div className='t t__md'>{name}</div>
              <div className='t t__sm t--light'>
                {Object.keys(members).length} member{Object.keys(members).length === 1 ? '' : 's'}
              </div>
            </Checkbox>
          ))
        }

        <Button variant='primary'>
          Join teams
        </Button>
      </form>
    </>
  )
}
