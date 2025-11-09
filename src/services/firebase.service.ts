/* eslint-disable prefer-const */
/* eslint-disable no-var */
import { Injectable } from '@nestjs/common';
import firebaseadmin from './config/firebase.config';
import moment from 'moment';
import { User } from 'src/modules/user/interface/user.interface';

@Injectable()
export class FirebaseService {
  async sendToGeneral(title: string, message: string, resource_link?: string) {
    let messageData = {
      notification: {
        title,
        body: message ?? '',
      },

      data: {
        message,
        resource_link: resource_link ?? '',
        type: 'general',
        created_at: moment().format(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },

      android: {
        notification: {
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },

      topic: 'general',
    };

    // console.log("::::::::::::::::::::::", message)

    firebaseadmin
      .messaging()
      .send(messageData)
      .then((response) => {
        console.log('Notifications response:+++====>>> ', response);
      })
      .catch((error) => {
        console.log(error);
      });
    return;
  }

  async sendToUser(
    user: User,
    title: string,
    message: string,
    imageUrl: string,
    resource_link?: string,
  ) {
    var registrationToken = user.device_token;

    const androidNotification: any = {
      sound: 'default',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    };

    if (imageUrl) androidNotification.imageUrl = imageUrl;

    if (registrationToken?.length) {
      for (let token of registrationToken) {
        var messageData = {
          notification: {
            title,
            body: message,
          },

          data: {
            message,
            resource_link: resource_link ?? '',
            type: 'individual',
            created_at: moment().format(),
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },

          android: {
            notification: androidNotification,
          },

          token,
        };
        // console.log(registrationToken);f
        firebaseadmin
          .messaging()
          .send(messageData)
          .then((response) => {
            console.log(response);
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
      }
    }
    return;
  }

  async subscribeToTopic(registrationToken: string, topic: string) {
    firebaseadmin
      .messaging()
      .subscribeToTopic(registrationToken, topic)
      .then(function (response) {
        console.log('Successfully subscribed to topic:', response);
      })
      .catch(function (error) {
        console.log('Error subscribing to topic:', error);
      });
  }

  async unsubscribeToTopic(registrationToken: string, topic: string) {
    // console.log(registrationTokens);
    firebaseadmin
      .messaging()
      .unsubscribeFromTopic(registrationToken, topic)
      .then(function (response) {
        console.log('Successfully subscribed to topic:', response);
      })
      .catch(function (error) {
        console.log('Error subscribing to topic:', error);
      });
  }
  async register(data: any) {
    try {
      // let firebaseAdmin = serviceAccount;

      return firebaseadmin
        .auth()
        .createUser({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          // photoURL: data.photoURL,
          emailVerified: true,
          disabled: false,
        })
        .then(function (response) {
          console.log('successfully created user:', response);
          return response;
        })
        .catch(function (error) {
          console.log('Error creating user:', error);
          return null;
        });
    } catch (error) {
      console.log(
        '🚀 ~ file: firebase.service.ts:201 ~ FirebaseService ~ register ~ error:',
        error,
      );
      return;
    }
  }

  async getUser(data: any) {
    try {
      // let firebaseAdmin = serviceAccount;

      let status = false;

      return firebaseadmin
        .auth()
        .getUserByEmail(data.email)
        .then(function (response) {
          console.log('successfully fetched user:', response.toJSON());
          status = true;
        })
        .catch(async function (error) {
          console.log('Error getting user:', error);
        });
      // if (!status) {
      //   await this.register(data);
      // }
      return;
    } catch (error) {
      console.log(
        '🚀 ~ file: firebase.service.ts:228 ~ FirebaseService ~ getUser ~ error:',
        error,
      );
      return;
    }
  }
}
