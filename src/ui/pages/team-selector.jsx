import * as React from 'react'

import { motion } from 'framer-motion'
import { firebase } from '../../common/firebase'
import 'firebase/firestore'

import { Checkbox } from '../../common/components/checkbox'

import Skeleton from '../../common/components/skeleton'

const countMembers = (members) => +Object
      .entries(members)
      .filter(([ , v ]) => v)
      .length

const { useState, useEffect } = React
const TeamsSkel = ({ count }) => (
  <>
    {
      Array(count)
        .fill()
        .map((_, i) => (
          <div
            key={`skeleton-${i}`}
            style={{ display: 'flex', alignItems: 'center', margin: '15px 0', marginLeft: 2, maxHeight: 38 }}
          >
            <Skeleton.Avatar size='sm' style={{ marginRight: 8 }} />
            <div style={{ width: 'calc(100% - 48px)', display: 'inline-block' }}>
              <Skeleton.Text style={{ margin: 8 }} width={(128 * (i + 1)) % 192} size='md' />
              <Skeleton.Text style={{ margin: 8 }} width={(164 * (i + 1)) % 186} size='sm' />
            </div>
          </div>
        ))
    }
  </>
)

export default ({ user }) => {
  const [loading, setLoading] = useState(true)

  console.log(user)

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(user.team)

  useEffect(() => {
    (
      async () => {
        setLoading(true)
        const teamsRef = await firebase
              .firestore()
              .collection('/teams')
              .get()

        const res = []
        teamsRef.forEach(ref => res.push({ id: ref.id, ...ref.data() }))
        setTeams(res)
        setLoading(false)
      }
    )()
  }, [])

  return (
    <>
      <h5>Select your team</h5>
      <p>
        Choose the team you would <br />
        like to work on
      </p>

      <form
        style={{ textAlign: 'left' }}
        onSubmit={e => e.preventDefault()}
      >
        {loading && (
          <TeamsSkel count={2} />
        )}

        {
          teams.map(({ name, members = {}, id }, i) => (
            <motion.div
              initial='hidden'
              animate='visible'
              transition={{
                delay: i / 4,
                type: 'spring',
                stiffness: 600
              }}
              variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: 20, opacity: 0 }
              }}
              key={i}
            >
              <Checkbox
                type='radio'
                checked={selectedTeam === id}
                style={{ margin: '16px 0' }}
                onChange={_ => {
                  firebase
                    .firestore()
                    .collection('/users')
                    .doc(user.uid)
                    .set({ team: id }, { merge: true })

                  setSelectedTeam(id)
                }}
              >
                <div className='t t__md'>{name}</div>
                <div className='t t__sm t--light'>
                  {countMembers(members)} member{countMembers(members) === 1 ? '' : 's'}
                </div>
              </Checkbox>
            </motion.div>
          ))
        }
      </form>
    </>
  )
}
