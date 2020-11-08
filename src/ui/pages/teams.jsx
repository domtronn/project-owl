import * as React from 'react'

import { motion } from 'framer-motion'
import { firebase } from '../../common/firebase'
import 'firebase/firestore'

import { Button } from '../../common/components/button'
import { Checkbox } from '../../common/components/checkbox'

import Skeleton from '../../common/components/skeleton'

const { useState, useEffect } = React
const TeamsSkel = ({ count }) => Array(count)
  .fill()
  .map((_, i) => (
    <div
      key={`skeleton-${i}`}
      style={{ display: 'flex', alignItems: 'center', margin: '16px 0', marginLeft: 2, maxHeight: 38 }}
    >
      <Skeleton.Avatar size='sm' style={{ marginRight: 8 }} />
      <div style={{ width: 'calc(100% - 48px)', display: 'inline-block' }}>
        <Skeleton.Text style={{ margin: 8 }} width={(128 * (i + 1)) % 192} size='md' />
        <Skeleton.Text style={{ margin: 8 }} width={(164 * (i + 1)) % 186} size='sm' />
      </div>
    </div>
  ))

export default ({ user }) => {
  const [loading, setLoading] = useState(true)

  const [teams, setTeams] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])

  useEffect(() => {
    (
      async () => {
        setLoading(true)
        const teamsRef = await firebase
              .firestore()
              .collection('/teams')
              .get()

        const res = []
        teamsRef.forEach(ref => res.push({ id: ref.id, ...ref.data()}))
        setTeams(res)
        setLoading(false)
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
                style={{ margin: '16px 0' }}
                onChange={_ => {
                  setSelectedTeams(
                    selectedTeams.includes(id)
                      ? selectedTeams.filter(i => i !== id)
                      : selectedTeams.concat(id)
                  )
                }}
                checked={selectedTeams.includes(id)}
              >
                <div className='t t__md'>{name}</div>
                <div className='t t__sm t--light'>
                  {Object.keys(members).length} member{Object.keys(members).length === 1 ? '' : 's'}
                </div>
              </Checkbox>
            </motion.div>
          ))}

        <Button variant='primary'>
          Join teams
        </Button>
      </form>
    </>
  )
}
