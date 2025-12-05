import { BadRequestException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectStripe } from 'nestjs-stripe';
import * as _ from 'lodash';
// import { StripeCreateProductDto } from 'src/subscription/dto/stripe-create-package.dto';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/user/interface/user.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class StripeService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectStripe() private readonly stripe: Stripe,
  ) {}

  async addProductPrice(payload: any) {
    return await this.stripe.prices.create(payload);
  }

  async checkoutSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return session;
  }

  public async stripePurchaseToken(payload: any) {
    const { user, tokens, amount } = payload;
    // const amount = _.mu ltiply(tokens, this.config.get('tokens.usdRate'));

    const orderPayload = {
      metadata: {
        publicId: user.publicId,
        tokens,
        paymentType: 'token',
      },
      line_items: [
        {
          price_data: {
            currency: 'USD',
            product_data: {
              name: `Purchase of ${tokens} toonkens`,
            },
            unit_amount: Number(
              parseFloat(String(_.multiply(Number(amount), 100))).toFixed(2),
            ),
          },
          // For metered billing, do not pass quantity
          quantity: 1,
          // currency: process.env.CURRENCY
        },
      ],
    };
    return await this.stripeCreateCheckoutSession({
      ...payload,
      ...orderPayload,
    });
    // return;
  }

  public async stripeCreateCheckoutSession(payload: any) {
    const {
      user,
      metadata,
      line_items,
      origin,
      reference,
      success_url,
      cancel_url,
    } = payload;
    console.log(
      '🚀 ~ StripeService ~ stripeCreateCheckoutSession ~ success_url:',
      success_url,
    );

    let customer;
    let customerId = user.stripeCustomerId;

    // Validate that stripeCustomerId is a valid customer ID (starts with 'cus_')
    // If it's an account ID (starts with 'acct_') or invalid, treat as missing
    if (customerId && !customerId.startsWith('cus_')) {
      console.warn(
        `Invalid customer ID format: ${customerId}. Expected customer ID (cus_*), got account ID or invalid format. Creating new customer.`,
      );
      customerId = null;
    }

    // Verify customer exists in Stripe if we have a customer ID
    if (customerId) {
      try {
        await this.stripe.customers.retrieve(customerId);
      } catch (error) {
        console.warn(
          `Customer ${customerId} not found in Stripe. Creating new customer.`,
        );
        customerId = null;
      }
    }

    if (!customerId) {
      customer = await this.stripe.customers.create({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      customerId = customer.id;

      await this.userModel.updateOne(
        { _id: user._id },
        { stripeCustomerId: customerId },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    // const reference = `web:${Date.now()}`;
    // const subscription = new this.model({
    //   transactionId: reference,
    //   user: user._id,
    // });
    // await subscription.save();
    // For Checkout Sessions, Apple Pay and Google Pay are supported through payment_method_types
    // Note: TypeScript types may not include these, but Stripe API supports them
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'] as any, // Allows Apple Pay and Google Pay to be enabled automatically
      customer: String(customerId),
      client_reference_id: reference,
      metadata,
      line_items,
      success_url,
      cancel_url,
    });

    return session.url;
  }

  public async stripeCreatePaymentIntent(payload: any) {
    const { user, ...rest } = payload;

    let customer;
    let customerId = user.stripeCustomerId;

    // Validate that stripeCustomerId is a valid customer ID (starts with 'cus_')
    // If it's an account ID (starts with 'acct_') or invalid, treat as missing
    if (customerId && !customerId.startsWith('cus_')) {
      console.warn(
        `Invalid customer ID format: ${customerId}. Expected customer ID (cus_*), got account ID or invalid format. Creating new customer.`,
      );
      customerId = null;
    }

    // Verify customer exists in Stripe if we have a customer ID
    if (customerId) {
      try {
        await this.stripe.customers.retrieve(customerId);
      } catch (error) {
        console.warn(
          `Customer ${customerId} not found in Stripe. Creating new customer.`,
        );
        customerId = null;
      }
    }

    if (!customerId) {
      customer = await this.stripe.customers.create({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      customerId = customer.id;

      await this.userModel.updateOne(
        { _id: user._id },
        { stripeCustomerId: customerId },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    // Configure automatic payment methods for Apple Pay and Google Pay
    // When using automatic_payment_methods, only specify 'card' in payment_method_types
    // Stripe will automatically enable Apple Pay and Google Pay if available
    const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
      ...rest,
      customer: String(customerId),
      // payment_method_types: ['automatic_payment_methods'],
      // payment_method_types: rest.payment_method_types || ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
    };

    return await this.stripe.paymentIntents.create(paymentIntentConfig);
  }

  async createCheckoutSession(customerId: string, priceId: string) {
    console.log('customerId: ', customerId);
    // For Checkout Sessions, Apple Pay and Google Pay are supported through payment_method_types
    // Note: TypeScript types may not include these, but Stripe API supports them
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'] as any, // Allows Apple Pay and Google Pay to be enabled automatically
      customer: customerId,
      client_reference_id: customerId,
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
          // currency: process.env.CURRENCY
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: `${process.env.WEB_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_URL}/subscription`,
    });

    return session.url;
  }

  async createCustomer(name: string, email: string) {
    return this.stripe.customers.create({
      name,
      email,
    });
  }

  async createProduct(name: string, description: string) {
    return await this.stripe.products.create({
      name,
      description,
    });
  }

  async customerPortal(customerId: string) {
    // This is the url to which the customer will be redirected when they are done
    // managing their billing with the portal.
    const returnUrl = process.env.DOMAIN;

    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return portalSession.url;
  }

  public async createStripeAccount(payload: any) {
    const user = await this.userModel.findOne({ _id: payload.user });

    let account;

    if (user.stripeConnect?.active) {
      return this.manageStripeAccount(payload);
    }

    if (!user.stripeConnect?.stripeCustomerId) {
      account = await this.stripe.accounts.create({
        type: 'express',
      });
      console.log(
        '🚀 ~ StripeService ~ createStripeAccount ~ account:',
        account,
      );

      await this.userModel.updateOne(
        { _id: user._id },
        {
          stripeConnect: {
            stripeCustomerId:
              user.stripeConnect.stripeCustomerId ?? account?.id,
            active: false,
          },
        },
        {
          // upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: user.stripeConnect.stripeCustomerId ?? account?.id,
      refresh_url: `${payload.reauth_url}`,
      return_url: `${payload.return_url}`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  public async createStripeAccountReturn(payload: any) {
    return payload;
  }

  public async manageStripeAccount(payload: any) {
    const user = await this.userModel.findOne({ _id: payload.user });

    if (!user.stripeConnect.stripeCustomerId) {
      return await this.createStripeAccount(payload);
    }

    const accountLink = await this.stripe.accounts.createLoginLink(
      user.stripeConnect.stripeCustomerId,
    );

    return { url: accountLink.url };
  }

  async getProductDetails(productId: string) {
    return await this.stripe.products.retrieve(productId);
  }

  async retrieveSession(session_id: any) {
    return await this.stripe.checkout.sessions.retrieve(session_id);
  }

  /**
   * Create a payment method for Apple Pay or Google Pay
   */
  public async createPaymentMethod(payload: {
    type: 'apple_pay' | 'google_pay' | 'card';
    apple_pay?: {
      payment_data: any;
      payment_method: any;
      transaction_identifier: string;
    };
    google_pay?: {
      payment_method_data: any;
    };
    card?: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    };
    billing_details?: Stripe.PaymentMethodCreateParams.BillingDetails;
  }) {
    const { type, apple_pay, google_pay, card, billing_details } = payload;

    const paymentMethodParams: Stripe.PaymentMethodCreateParams = {
      type: type === 'apple_pay' || type === 'google_pay' ? 'card' : type,
      billing_details,
    };

    if (type === 'apple_pay' && apple_pay) {
      paymentMethodParams.type = 'card';
      // Apple Pay token is handled by Stripe.js on the client side
      // This method is for attaching payment methods created on the client
    } else if (type === 'google_pay' && google_pay) {
      paymentMethodParams.type = 'card';
      // Google Pay token is handled by Stripe.js on the client side
      // This method is for attaching payment methods created on the client
    } else if (type === 'card' && card) {
      paymentMethodParams.card = card;
    }

    return await this.stripe.paymentMethods.create(paymentMethodParams);
  }

  /**
   * Attach a payment method to a customer
   */
  public async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ) {
    return await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Confirm a payment intent with a payment method
   */
  public async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
    returnUrl?: string,
  ) {
    const params: Stripe.PaymentIntentConfirmParams = {};

    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    if (returnUrl) {
      params.return_url = returnUrl;
    }

    return await this.stripe.paymentIntents.confirm(paymentIntentId, params);
  }

  /**
   * Retrieve payment intent details
   */
  public async retrievePaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * List payment methods for a customer
   */
  public async listCustomerPaymentMethods(
    customerId: string,
    type: 'card' | 'apple_pay' | 'google_pay' = 'card',
  ) {
    return await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card', // Apple Pay and Google Pay are card payment methods
    });
  }

  /**
   * Create a payment intent specifically configured for Apple Pay and Google Pay
   */
  public async createMobilePaymentIntent(payload: {
    user: any;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    return_url?: string;
  }) {
    const { user, amount, currency, metadata, return_url } = payload;

    let customer;
    let customerId = user.stripeCustomerId;

    // Validate that stripeCustomerId is a valid customer ID (starts with 'cus_')
    // If it's an account ID (starts with 'acct_') or invalid, treat as missing
    if (customerId && !customerId.startsWith('cus_')) {
      console.warn(
        `Invalid customer ID format: ${customerId}. Expected customer ID (cus_*), got account ID or invalid format. Creating new customer.`,
      );
      customerId = null;
    }

    // Verify customer exists in Stripe if we have a customer ID
    if (customerId) {
      try {
        await this.stripe.customers.retrieve(customerId);
      } catch (error) {
        console.warn(
          `Customer ${customerId} not found in Stripe. Creating new customer.`,
        );
        customerId = null;
      }
    }

    if (!customerId) {
      customer = await this.stripe.customers.create({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      customerId = customer.id;

      await this.userModel.updateOne(
        { _id: user._id },
        { stripeCustomerId: customerId },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: String(customerId),
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata || {},
      ...(return_url && { return_url: return_url }),
    });

    return paymentIntent;
  }

  async webhookSignatureVerification(body: any, headers: any) {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      const signature = headers['stripe-signature'];

      try {
        event = await this.stripe.webhooks.constructEvent(
          body.rawBody,
          signature,
          webhookSecret,
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        console.log(err);
        throw new BadRequestException();
      }
      // Extract the object from the event.
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = body.data;
      eventType = body.type;
    }

    return { object: data.object, type: eventType };
  }
}
