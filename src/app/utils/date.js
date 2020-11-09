import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import calendar from 'dayjs/plugin/calendar'

dayjs().format()
dayjs.extend(relativeTime)
dayjs.extend(calendar)

export default dayjs
