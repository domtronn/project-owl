import fb from 'firebase/app'

import 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD1uZNi8ipB-Y60RBwQhkPaUYyPJTfFroQ',
  authDomain: 'project-owl-4acc6.firebaseapp.com',
  databaseURL: 'https://project-owl-4acc6.firebaseio.com',
  projectId: 'project-owl-4acc6',
  storageBucket: 'project-owl-4acc6.appspot.com',
  messagingSenderId: '146591413764',
  appId: '1:146591413764:web:22ce46d5540950d9d96751'
}

export const firebase = !fb.apps.length
  ? fb.initializeApp(firebaseConfig)
  : fb.app()
