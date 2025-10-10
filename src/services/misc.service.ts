import { Injectable } from '@nestjs/common';
import moment from 'moment';
import fs from 'fs';

@Injectable()
export class MiscCLass {
  async referenceGenerator() {
    const time = moment().format('YYYY-MM-DD hh:mm:ss');
    const rand = Math.floor(Math.random() * Date.now());

    return `BAM|${time.replace(/[\-]|[\s]|[\:]/g, '')}|${rand}`;
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

  async getStates() {
    const stateObj = [];
    const states = JSON.parse(
      fs.readFileSync(`${__dirname}/assets/states.txt`, 'utf-8'),
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

  async search(params: any) {
    console.log(
      '🚀 ~ file: misc.service.ts ~ line 65 ~ MiscCLass ~ search ~ params',
      params,
    );
    const query = {};
    for (const value in params) {
      if (value.match(/date|Date|createdAt/g)) {
        const date = new Date(params[value]);
        const endDate = moment(date).add(1, 'day').format();
        query['createdAt'] = { $gte: date, $lte: new Date(endDate) };
      } else if (params[value] == 'true') {
        query[value] = true;
      } else if (params[value] == 'false') {
        query[value] = false;
      } else if (value == 'category') {
        query[value] = { $in: params[value] };
      } else {
        query[value] = params[value];
      }
    }
    return query;
  }
}
