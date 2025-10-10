/* eslint-disable prefer-const */
/* eslint-disable no-var */
import { Injectable } from '@nestjs/common';
import firebaseadmin from './config/firebase.config';
import moment from 'moment';

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
    user: any,
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

    if (registrationToken.length) {
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
}
