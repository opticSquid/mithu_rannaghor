# Mithur Rannaghor app

This app is to add customers, maintain transactions which can be verified by customers as well.

## Requirements
### Business Requirements
1. On Board customers
2. Track delivery record
3. Maintain a running track of subscription
4. Maintain business books
5. Show revenue
4. Send notification on new order to business
5. Send delivery notifications to customers
6. Send bill alerts to customers

### Technical Requirements
1. Lowest Barrier to Customer Onboarding
2. Ease of use on mobile and desktop but primarily design for mobile and adapt it to desktop. Basically mobile first.
3. Avaiable in English, Hindi, Bengali
4. Use docker compose, inside docker compose define all the services you need like db or cache etc.
5. backend should also be a container and frontend should also be a container that would finnaly go into docker cmpose to complete the stack.

## Basic Model

1. Every Customer would have a wallet that would be filled at starting of month when they renew subscription.
2. For every food delivery done, a fixed amount would be deducted from the wallet.
3. At any point of time a customer would be able to view their wallet balance and the transactions in their wallet.
4. Business would be able to view revenue for each customer.
5. There would be 2 subscription model.
5.1 Monthly
5.2 One off
6. For monthly customers business would see recurring order for lunch and dinner unless customers skips for a shift or an entire day.
7. For monthly customers they would be able to set preference on which weekdays they want veg and on which weekdays they want non veg.
8. For one off customers they would set veg non veg preference when they order.
9. Quantity per customer would default to 1 plate per shift (shift means lunch or dinner) unless they change some specific day or some specific shift. that would be on temporary basis.
10. Menu is fixed for each day, but that menu should be able to change from business end and customers that have order would get notified. In app also they would see menu of the day and shift.

