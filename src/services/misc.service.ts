import { Injectable } from '@nestjs/common';
import moment from 'moment';
import fs from 'fs';
import { ObjectId } from 'bson';
import * as momentTz from 'moment-timezone';

@Injectable()
export class MiscCLass {
  async referenceGenerator() {
    const time = moment().format('YYYY-MM-DD hh:mm:ss');
    const rand = Math.floor(Math.random() * Date.now());

    return `CNFDNT-${time.replace(/[\-]|[\s]|[\:]/g, '')}-${rand}`;
  }

  async paginate({ page, pageSize }) {
    const offset = (parseInt(page) - 1) * pageSize;
    const limit = parseInt(pageSize);

    return {
      offset,
      limit,
    };
  }

  async pageCount({ count, page, pageSize }) {
    const pageTotal = Math.ceil(count / pageSize);
    let prevPage = null;
    let nextPage = null;

    if (page == pageTotal && page > 1) {
      prevPage = parseInt(page) - 1;
      nextPage = null;
    } else if (page > 1) {
      prevPage = parseInt(page) - 1;
      nextPage = parseInt(page) + 1;
    } else if (page == 1 && pageTotal > 1) {
      nextPage = 2;
    }

    return {
      prevPage,
      currentPage: parseInt(page),
      nextPage,
      pageTotal,
      pageSize: pageSize > count ? parseInt(count) : parseInt(pageSize),
    };
  }

  async millisToMinutesAndSeconds(millis: number) {
    const minutes = Math.floor(millis / 60000);
    const seconds = Number(((millis % 60000) / 1000).toFixed(0));
    return seconds == 60 ? minutes : minutes;
  }

  async getStates() {
    const stateObj = [];
    const states = JSON.parse(
      fs.readFileSync(`${__dirname}/states/states.txt`, 'utf-8'),
    );

    for (const state of states) {
      stateObj.push(state.state);
    }
    return {
      status: 'success',
      message: 'states fetched',
      data: stateObj,
    };
  }

  async IsObjectId(value: string) {
    try {
      return (
        value &&
        value.length > 12 &&
        String(new ObjectId(value)) === String(value)
      );
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async search(params: any) {
    console.log(
      '🚀 ~ file: misc.service.ts:71 ~ MiscCLass ~ search ~ params:',
      params,
    );
    let query = {};
    let date;
    let endDate;
    for (const value in params) {
      if (value.match(/date|Date|createdAt|endDate|startDate/g)) {
        if (value == 'startDate') date = new Date(params[value]);
        if (value == 'endDate') endDate = new Date(params[value]);
        if (value !== 'startDate' && value !== 'endDate') {
          date = new Date(params[value]);
          endDate = new Date(moment(date).add(1, 'day').format());
        }
        if (value == 'date') {
          query['date'] = { $gte: date, $lte: endDate };
        } else {
          query['createdAt'] = { $gte: date, $lte: endDate };
        }
      } else if (await this.IsObjectId(String(params[value]))) {
        query[value] = params[value];
      } else if (value == 'recepient') {
        query = {
          ...query,
          $or: [{ user: params[value] }, { counsellor: params[value] }],
        };
      } else if (params[value] == 'true' || params[value] == true) {
        query[value] = true;
      } else if (params[value] == 'false' || params[value] == false) {
        query[value] = false;
      } else if (value == 'category' || value == 'categories') {
        query[value] = { $in: params[value] };
      } else {
        const $regex = new RegExp(params[value]);
        const $options = 'i';
        query[value] = { $regex, $options };
      }
    }
    return query;
  }

  async globalSearch(query: any) {
    const $regex = new RegExp(query);
    const $options = 'i';
    return { $regex, $options };
  }

  async getFirstAndLastDay() {
    const date_today = new Date();

    const firstDay = new Date(
      date_today.getFullYear(),
      date_today.getMonth(),
      1,
    );

    const lastDay = new Date(
      date_today.getFullYear(),
      date_today.getMonth() + 1,
      0,
    );

    console.log(`The first date of the current month is: ${firstDay}`);

    console.log(`The last date of the current month is: ${new Date(lastDay)}`);
    return {
      firstDay,
      lastDay,
    };
  }

  async createDateFromTimezone(dateTime: string, timezone: string) {
    // Create a moment object with the given date, time, and timezone
    const eventMoment = momentTz.tz(dateTime, timezone);
    console.log(
      '🚀 ~ MiscCLass ~ createDateFromTimezone ~ eventMoment:',
      eventMoment,
    );

    // Convert to UTC for storage
    const utcDate = eventMoment.utc().toDate();

    return utcDate;
  }

  async getTimeFromDateTimeString(
    dateTimeString: string,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): Promise<string> {
    const momentObj = moment(dateTimeString, format);

    if (!momentObj.isValid()) {
      throw new Error('Invalid datetime string');
    }

    return momentObj.format('HH:mm:ss');
  }

  async capitalizeFirstLetter(word: string): Promise<string> {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  async capitalizeEachWord(sentence: string): Promise<string> {
    if (!sentence) return '';
    return sentence
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async getDayOfWeek(dateString: string): Promise<string> {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const momentObj = moment(dateString);

    if (!momentObj.isValid()) {
      throw new Error('Invalid date string');
    }

    return momentObj.format('dddd'); // Returns full day name (e.g., "Monday", "Tuesday")
  }

  async getDayOfWeekShort(dateString: string): Promise<string> {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const momentObj = moment(dateString);

    if (!momentObj.isValid()) {
      throw new Error('Invalid date string');
    }

    return momentObj.format('ddd'); // Returns short day name (e.g., "Mon", "Tue")
  }

  async getDayOfWeekNumber(dateString: string): Promise<number> {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const momentObj = moment(dateString);

    if (!momentObj.isValid()) {
      throw new Error('Invalid date string');
    }

    return momentObj.day(); // Returns day number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  }

  async generateRandomPassword(length = 8): Promise<string> {
    // Generate a random password with letters, numbers, and special characters
    // const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one character from each category
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$*';

    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    // Fill the rest with random characters from the full charset
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password to randomize the position of required characters
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    // Hash the password using bcryptjs with salt rounds of 11 (same as used elsewhere in the app)

    return password;
  }

  generateRandomNumber(length: number): string {
    const numbers = '0123456789';
    let randomNumber = '';
    for (let i = 0; i < length; i++) {
      randomNumber += numbers.charAt(
        Math.floor(Math.random() * numbers.length),
      );
    }
    return randomNumber;
  }
}
