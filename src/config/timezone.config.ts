import moment from 'moment-timezone';
import { DEFAULT_TIMEZONE } from '../framework/constants';

if (process.env.TZ !== DEFAULT_TIMEZONE) {
  process.env.TZ = DEFAULT_TIMEZONE;
}

moment.tz.setDefault(DEFAULT_TIMEZONE);
