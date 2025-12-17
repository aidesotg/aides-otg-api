import { Injectable } from '@nestjs/common';
import moment from 'moment';
import fs from 'fs';
import { ObjectId } from 'bson';
import * as mongoose from 'mongoose';
import * as momentTz from 'moment-timezone';
import { AddressDto, LocationDto } from 'src/modules/user/dto/address.dto';

@Injectable()
export class MiscCLass {
  async referenceGenerator() {
    const time = moment().format('YYYY-MM-DD hh:mm:ss');
    const rand = Math.floor(Math.random() * Date.now());

    return `AIDESOTG-${time.replace(/[\-]|[\s]|[\:]/g, '')}-${rand}`;
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
      } else if (value == 'rating' || value == 'ratings') {
        query[value] = Number(params[value]);
      } else {
        const $regex = new RegExp(params[value]);
        const $options = 'i';
        query[value] = { $regex, $options };
      }
    }
    return query;
  }

  /**
   * Build base Mongo query and filter config for the service request pool
   * (used by getRequestsPool). This centralizes filter logic so it can be
   * reused and tested independently.
   */
  async buildServiceRequestPoolQuery(
    params: any,
    deps: {
      beneficiaryModel: any;
      userModel: any;
    },
  ): Promise<{
    query: any;
    timeOfDay?: string | string[];
    quickFilters: Set<string>;
    minPrice?: number;
    maxPrice?: number;
    radius?: number;
    autoAdjustRadius?: boolean;
    sortBy?: string;
  }> {
    const {
      status,
      care_type,
      startDate,
      endDate,
      search,
      // Price range (offered price slider)
      minPrice,
      maxPrice,
      // Needs (e.g. Medication, Wheelchair, Dementia care, etc.)
      needs,
      // Time of day filters (Morning, Afternoon, Evening, Night)
      timeOfDay,
      // Duration filters (Short, Half-day, Full-day, Overnight, Multi-day)
      duration,
      // Distance / radius in miles (from caregiver location)
      radius,
      autoAdjustRadius,
      // Sort options: newest | nearest | highestPay | earliestStart
      sortBy,
      // Quick filters: today | thisWeek | nearMe | urgent
      quickFilter,
      filter,
      ...rest
    } = params;

    const query: any = await this.search(rest);

    // Filter by status
    if (status) {
      // Handle special status "Unassigned" which means Pending and no caregiver
      if (status === 'Unassigned') {
        query.status = 'Pending';
        query.care_giver = null;
      } else {
        query.status = status;
      }
    }

    // Filter by care_type (Care type chips)
    if (care_type) {
      // care_type is an array, so use $in to match any of the provided care types
      const careTypeArray = Array.isArray(care_type) ? care_type : [care_type];
      query.care_type = { $in: careTypeArray };
    }

    // Filter by duration (Duration chips)
    if (duration) {
      const durationArray = Array.isArray(duration) ? duration : [duration];
      query.duration_type = { $in: durationArray };
    }

    // Filter by beneficiary needs (Needs chips)
    if (needs) {
      const needsArray = Array.isArray(needs) ? needs : [needs];
      const matchingBeneficiaries = await deps.beneficiaryModel
        .find({ special_requirements: { $all: needsArray } })
        .select('_id')
        .exec();

      const beneficiaryIds = matchingBeneficiaries.map((b) => b._id);

      // If no beneficiaries match the needs, ensure query returns empty result
      if (!beneficiaryIds.length) {
        query.beneficiary = { $in: [] };
      } else {
        query.beneficiary = { $in: beneficiaryIds };
      }
    }

    // Filter by date range (createdAt and date_list)
    if (startDate || endDate) {
      const dateConditions: any[] = [];

      // Filter by createdAt
      const createdAtCondition: any = {};
      if (startDate) {
        createdAtCondition.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAtCondition.$lte = end;
      }
      if (Object.keys(createdAtCondition).length > 0) {
        dateConditions.push({ createdAt: createdAtCondition });
      }

      // Filter by date_list array using $elemMatch
      const dateListMatchCondition: any = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateListMatchCondition.$gte = start;
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateListMatchCondition.$lte = end;
      }
      if (Object.keys(dateListMatchCondition).length > 0) {
        dateConditions.push({
          date_list: {
            $elemMatch: {
              date: dateListMatchCondition,
            },
          },
        });
      }

      // Use $or to match either createdAt or date_list dates
      if (dateConditions.length > 0) {
        // Handle existing $or or $and in query
        if (query.$or) {
          // If query already has $or, combine it with date conditions using $and
          if (query.$and) {
            query.$and.push({ $or: dateConditions });
          } else {
            query.$and = [{ $or: query.$or }, { $or: dateConditions }];
            delete query.$or;
          }
        } else if (query.$and) {
          // If query already has $and, add date conditions to it
          query.$and.push({ $or: dateConditions });
        } else {
          query.$or = dateConditions;
        }
      }
    }

    // Global search functionality
    if (search) {
      const searchConditions: any[] = [];
      const searchRegex = new RegExp(search, 'i');

      // Search by booking_id
      searchConditions.push({ booking_id: searchRegex });

      // Search by status
      searchConditions.push({ status: searchRegex });

      // Search by created_by or care_giver if search is a valid ObjectId
      if (await this.IsObjectId(search)) {
        searchConditions.push({ created_by: search });
        searchConditions.push({ care_giver: search });
        searchConditions.push({ beneficiary: search });
      }

      // Search by user names (caregiver, created_by)
      const userSearchRegex = new RegExp(search, 'i');
      const matchingUsers = await deps.userModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingUsers.length > 0) {
        const userIds = matchingUsers.map((u) => u._id);
        searchConditions.push({ created_by: { $in: userIds } });
        searchConditions.push({ care_giver: { $in: userIds } });
        // Also search beneficiary if it's a User
        searchConditions.push({
          $and: [{ recepient_type: 'User' }, { beneficiary: { $in: userIds } }],
        });
      }

      // Search by beneficiary names (Beneficiary model)
      const matchingBeneficiaries = await deps.beneficiaryModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingBeneficiaries.length > 0) {
        const beneficiaryIds = matchingBeneficiaries.map((b) => b._id);
        searchConditions.push({
          $and: [
            { recepient_type: 'Beneficiary' },
            { beneficiary: { $in: beneficiaryIds } },
          ],
        });
      }

      // Combine search conditions with existing query using $or
      if (query.$or) {
        // If query already has $or, combine it with search conditions using $and
        if (query.$and) {
          query.$and.push({ $or: searchConditions });
        } else {
          query.$and = [{ $or: query.$or }, { $or: searchConditions }];
          delete query.$or;
        }
      } else if (query.$and) {
        // If query already has $and (e.g., from date filtering), add search conditions
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    // Build quick filters
    const quickFilters = new Set<string>();
    if (quickFilter) {
      const qfArray = Array.isArray(quickFilter) ? quickFilter : [quickFilter];
      qfArray.forEach((q) => quickFilters.add(String(q)));
    }
    if (filter && filter === 'today') quickFilters.add('today');
    if (filter && filter === 'thisWeek') quickFilters.add('thisWeek');
    if (filter && filter === 'nearMe') quickFilters.add('nearMe');
    if (filter && filter === 'urgent') quickFilters.add('urgent');

    return {
      query,
      timeOfDay,
      quickFilters,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      radius: radius ? Number(radius) : undefined,
      autoAdjustRadius:
        autoAdjustRadius === 'true' || autoAdjustRadius === true,
      sortBy,
    };
  }

  /**
   * Compute the start DateTime for a day log in the service request pool.
   */
  getServiceRequestStartDateTime(log: any): Date | null {
    const req: any = log.request;
    if (!req || !req.date_list || !req.date_list.length) return null;

    const daySlot =
      req.date_list.find(
        (d: any) => String(d._id) === String(log.day_id ?? (req as any).day_id),
      ) || req.date_list[0];

    if (!daySlot || !daySlot.date || !daySlot.start_time) return null;

    const start = new Date(daySlot.date);
    const [hoursStr, minutesStr] = String(daySlot.start_time).split(':');
    const hours = Number(hoursStr) || 0;
    const minutes = Number(minutesStr) || 0;
    start.setHours(hours, minutes, 0, 0);
    return start;
  }

  /**
   * Filter pool entries by time of day labels.
   */
  filterPoolByTimeOfDay(
    requestPool: any[],
    timeOfDay?: string | string[],
  ): any[] {
    if (!timeOfDay) return requestPool;
    const timeFilters = Array.isArray(timeOfDay) ? timeOfDay : [timeOfDay];

    const inRange = (date: Date, label: string) => {
      const hour = date.getHours();
      switch (label) {
        case 'Morning':
          return hour >= 5 && hour < 12;
        case 'Afternoon':
          return hour >= 12 && hour < 17;
        case 'Evening':
          return hour >= 17 && hour < 21;
        case 'Night':
          return hour >= 21 || hour < 5;
        default:
          return true;
      }
    };

    return requestPool.filter((log: any) => {
      const start = this.getServiceRequestStartDateTime(log);
      if (!start) return false;
      return timeFilters.some((label) => inRange(start, label));
    });
  }

  /**
   * Apply quick filters (today, thisWeek, urgent) to the request pool.
   */
  filterPoolByQuickFilters(
    requestPool: any[],
    quickFilters: Set<string>,
  ): any[] {
    if (
      !quickFilters ||
      (!quickFilters.has('today') &&
        !quickFilters.has('thisWeek') &&
        !quickFilters.has('urgent'))
    ) {
      return requestPool;
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const urgentHorizon = new Date(now);
    urgentHorizon.setHours(urgentHorizon.getHours() + 24);

    return requestPool.filter((log: any) => {
      const start = this.getServiceRequestStartDateTime(log);
      if (!start) return false;

      const isToday = start >= startOfToday && start <= endOfToday;
      const isThisWeek = start >= startOfToday && start <= endOfWeek;
      const isUrgent = start >= now && start <= urgentHorizon;

      let match = false;
      if (quickFilters.has('today')) match = match || isToday;
      if (quickFilters.has('thisWeek')) match = match || isThisWeek;
      if (quickFilters.has('urgent')) match = match || isUrgent;
      return match;
    });
  }

  /**
   * Sort and paginate the pool after all filters and distance calculations.
   */
  sortAndPaginatePool(
    poolWithDistance: any[],
    options: {
      sortBy?: string;
      page: number;
      pageSize: number;
    },
  ): { paginatedPool: any[]; count: number } {
    const { sortBy, page, pageSize } = options;

    if (sortBy === 'nearest') {
      poolWithDistance.sort((a, b) => {
        const da =
          typeof a.distance === 'number' ? a.distance : Number.MAX_VALUE;
        const db =
          typeof b.distance === 'number' ? b.distance : Number.MAX_VALUE;
        return da - db;
      });
    } else if (sortBy === 'highestPay') {
      poolWithDistance.sort((a, b) => {
        const pa = a.payment?.fee_per_hour || 0;
        const pb = b.payment?.fee_per_hour || 0;
        return pb - pa;
      });
    } else if (sortBy === 'earliestStart') {
      poolWithDistance.sort((a, b) => {
        const da =
          this.getServiceRequestStartDateTime(a as any)?.getTime() ??
          Number.MAX_VALUE;
        const db =
          this.getServiceRequestStartDateTime(b as any)?.getTime() ??
          Number.MAX_VALUE;
        return da - db;
      });
    } else {
      // Default: newest first by createdAt
      poolWithDistance.sort((a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });
    }

    const count = poolWithDistance.length;
    const pagination = {
      offset: (parseInt(String(page)) - 1) * pageSize,
      limit: parseInt(String(pageSize)),
    };
    const startIndex = pagination.offset;
    const endIndex = pagination.offset + pagination.limit;
    const paginatedPool = poolWithDistance.slice(startIndex, endIndex);

    return { paginatedPool, count };
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

  /**
   * Generate a random 8-character password with uppercase, lowercase, numbers, and special characters (#, $, @)
   * @returns {Promise<string>} A random 8-character password
   */
  async generateSecurePassword(): Promise<string> {
    const length = 8;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '#$@';
    const allChars = lowercase + uppercase + numbers + special;

    let password = '';

    // Ensure at least one character from each category
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    // Fill the rest with random characters from all categories
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to randomize the position of required characters
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

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

  /**
   * Format a date string and return only the date part
   * @param dateInput - Date string or Date object
   * @param outputFormat - Output format (default: 'YYYY-MM-DD')
   * @returns Formatted date string with date only
   */
  async formatDateOnly(
    dateInput: string | Date,
    outputFormat: string = 'YYYY-MM-DD',
  ): Promise<string> {
    if (!dateInput) {
      throw new Error('Date input is required');
    }

    const momentObj = moment(dateInput);

    if (!momentObj.isValid()) {
      throw new Error('Invalid date input');
    }

    return momentObj.format(outputFormat);
  }

  /**
   * Format a date string and return only the date part (US format)
   * @param dateInput - Date string or Date object
   * @returns Formatted date string in MM/DD/YYYY format
   */
  async formatDateUS(dateInput: string | Date): Promise<string> {
    return this.formatDateOnly(dateInput, 'MM/DD/YYYY');
  }

  /**
   * Format a date string and return only the date part (ISO format)
   * @param dateInput - Date string or Date object
   * @returns Formatted date string in ISO format (YYYY-MM-DD)
   */
  async formatDateISO(dateInput: string | Date): Promise<string> {
    return this.formatDateOnly(dateInput, 'YYYY-MM-DD');
  }

  /**
   * Format a date and return date with custom format
   * @param dateInput - Date string or Date object
   * @param format - Custom format (e.g., 'DD/MM/YYYY', 'YYYY/MM/DD')
   * @returns Formatted date string
   */
  async formatCustomDate(
    dateInput: string | Date,
    format: string,
  ): Promise<string> {
    return this.formatDateOnly(dateInput, format);
  }

  /**
   * Get time only from a date string
   * @param dateInput - Date string or Date object
   * @param outputFormat - Output format (default: 'HH:mm:ss')
   * @returns Formatted time string
   */
  async formatTimeOnly(
    dateInput: string | Date,
    outputFormat: string = 'HH:mm:ss',
  ): Promise<string> {
    if (!dateInput) {
      throw new Error('Date input is required');
    }

    const momentObj = moment(dateInput);

    if (!momentObj.isValid()) {
      throw new Error('Invalid date input');
    }

    return momentObj.format(outputFormat);
  }

  /**
   * Get time in 12-hour format (AM/PM)
   * @param dateInput - Date string or Date object
   * @returns Time in 12-hour format (e.g., "02:30 PM")
   */
  async formatTime12Hour(dateInput: string | Date): Promise<string> {
    return this.formatTimeOnly(dateInput, 'hh:mm A');
  }

  /**
   * Get time in 24-hour format
   * @param dateInput - Date string or Date object
   * @returns Time in 24-hour format (e.g., "14:30:00")
   */
  async formatTime24Hour(dateInput: string | Date): Promise<string> {
    return this.formatTimeOnly(dateInput, 'HH:mm:ss');
  }

  /**
   * Get time without seconds
   * @param dateInput - Date string or Date object
   * @returns Time without seconds (e.g., "14:30")
   */
  async formatTimeNoSeconds(dateInput: string | Date): Promise<string> {
    return this.formatTimeOnly(dateInput, 'HH:mm');
  }

  /**
   * Get custom time format
   * @param dateInput - Date string or Date object
   * @param format - Custom format (e.g., 'h:mm A', 'HH:mm')
   * @returns Formatted time string
   */
  async formatCustomTime(
    dateInput: string | Date,
    format: string,
  ): Promise<string> {
    return this.formatTimeOnly(dateInput, format);
  }
  async formatCoordinates(address: AddressDto): Promise<Record<string, any>> {
    return {
      ...address,
      coordinates: {
        type: 'Point',
        coordinates: [
          address.coordinates?.lng ?? 0,
          address.coordinates?.lat ?? 0,
        ],
      },
    };
  }

  /**
   * Calculate average rating for a caregiver from reviews
   * @param reviewModel - Review model instance
   * @param caregiverId - Caregiver ID (string or ObjectId)
   * @returns Average rating (0-5) or null if no reviews
   */
  async getCaregiverAverageRating(
    reviewModel: any,
    caregiverId: string | mongoose.Types.ObjectId,
  ): Promise<number | null> {
    // Convert to ObjectId if it's a string
    const caregiverObjectId =
      typeof caregiverId === 'string'
        ? new mongoose.Types.ObjectId(caregiverId)
        : caregiverId;

    const result = await reviewModel.aggregate([
      { $match: { care_giver: caregiverObjectId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (!result || result.length === 0 || !result[0].averageRating) {
      return null;
    }

    return Math.round(result[0].averageRating * 10) / 10; // Round to 1 decimal
  }

  /**
   * Filter and sort favorites based on rating and sort options
   * @param favorites - Array of favorite documents
   * @param reviewModel - Review model instance
   * @param params - Filter and sort parameters
   * @returns Filtered and sorted favorites with average ratings
   */
  async filterAndSortFavorites(
    favorites: any[],
    reviewModel: any,
    params: {
      rating?: number | string;
      sortBy?: string;
    },
  ): Promise<any[]> {
    const { rating, sortBy } = params;

    // Calculate average ratings for each favorite's caregiver
    const favoritesWithRatings = await Promise.all(
      favorites.map(async (favorite) => {
        // Handle both populated and unpopulated care_giver
        const caregiverId =
          favorite.care_giver?._id ||
          favorite.care_giver?.id ||
          favorite.care_giver;
        const avgRating = caregiverId
          ? await this.getCaregiverAverageRating(
              reviewModel,
              String(caregiverId),
            )
          : null;

        const favoriteObj = favorite.toObject
          ? favorite.toObject()
          : favorite instanceof Object && 'toObject' in favorite
          ? (favorite as any).toObject()
          : favorite;

        return {
          ...favoriteObj,
          averageRating: avgRating,
        };
      }),
    );

    // Filter by minimum rating
    let filtered = favoritesWithRatings;
    if (rating !== undefined && rating !== null) {
      const minRating = Number(rating);
      filtered = favoritesWithRatings.filter(
        (fav) => fav.averageRating !== null && fav.averageRating >= minRating,
      );
    }

    // Sort based on sortBy parameter
    if (sortBy === 'highestRated') {
      filtered.sort((a, b) => {
        const ratingA = a.averageRating ?? 0;
        const ratingB = b.averageRating ?? 0;
        return ratingB - ratingA; // Descending order
      });
    } else if (sortBy === 'nameAZ') {
      filtered.sort((a, b) => {
        const nameA = `${a.care_giver?.first_name || ''} ${
          a.care_giver?.last_name || ''
        }`
          .trim()
          .toLowerCase();
        const nameB = `${b.care_giver?.first_name || ''} ${
          b.care_giver?.last_name || ''
        }`
          .trim()
          .toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Default: mostRecentlyUsed (sort by createdAt descending)
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }

    return filtered;
  }
}

// 'YYYY-MM-DD' - ISO format (2024-03-15)
// 'MM/DD/YYYY' - US format (03/15/2024)
// 'DD/MM/YYYY' - European format (15/03/2024)
// 'YYYY/MM/DD' - International format (2024/03/15)
// 'MMMM Do YYYY' - Full date (March 15th 2024)
// 'DD-MMM-YYYY' - Short format (15-Mar-2024)

// Common Time Formats:
// 'HH:mm:ss' - Full 24-hour format (14:30:45)
// 'HH:mm' - 24-hour without seconds (14:30)
// 'hh:mm A' - 12-hour format with AM/PM (02:30 PM)
// 'h:mm A' - 12-hour format without leading zero (2:30 PM)
// 'HH:mm:ss.SSS' - With milliseconds (14:30:45.123)
// 'h:mm:ss A' - 12-hour with seconds (2:30:45 PM)
