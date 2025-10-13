/**
 * SMS Service Utility
 * Functions to send SMS using Twilio
 */

const { client, twilioPhone } = require('../config/sms');

class SMSService {
    /**
     * Send OTP via SMS
     */
    static async sendOTP(phone, otp, name) {
        const message = `Hi ${name}, Your ${process.env.APP_NAME} verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ OTP SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending OTP SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send booking request SMS to rider
     */
    static async sendBookingRequestSMS(phone, passengerName, seats, bookingUrl) {
        const message = `🔔 New Booking Request! ${passengerName} wants to book ${seats} seat(s) in your ride. View details: ${bookingUrl}`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Booking request SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending booking request SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send booking confirmation SMS
     */
    static async sendBookingConfirmation(phone, bookingDetails) {
        const message = `Booking Confirmed! Ride from ${bookingDetails.from} to ${bookingDetails.to} on ${bookingDetails.date} at ${bookingDetails.time}. Driver: ${bookingDetails.driverName}, ${bookingDetails.driverPhone}. Booking ID: ${bookingDetails.bookingId}`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Booking confirmation SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending booking SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send emergency SOS SMS alert
     */
    static async sendSOSAlert(phone, emergencyDetails) {
        // Build location info
        let locationInfo = emergencyDetails.location || 'Location not available';
        
        // If we have nearby services info, include it
        let nearbyInfo = '';
        if (emergencyDetails.nearestHospital) {
            nearbyInfo = ` Nearest hospital: ${emergencyDetails.nearestHospital} (${emergencyDetails.hospitalDistance}).`;
        }
        if (emergencyDetails.nearestPolice) {
            nearbyInfo += ` Police: ${emergencyDetails.nearestPolice} (${emergencyDetails.policeDistance}).`;
        }
        
        const message = `🚨 EMERGENCY: ${emergencyDetails.userName} triggered ${emergencyDetails.emergencyType || 'SOS'} at ${emergencyDetails.time}. ` +
                       `Location: ${locationInfo}${nearbyInfo} ` +
                       `Track: ${emergencyDetails.trackingLink} ` +
                       `ID: ${emergencyDetails.emergencyId}`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ SOS alert SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending SOS SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send ride starting reminder SMS
     */
    static async sendRideReminder(phone, rideDetails, hoursUntil) {
        const message = `Reminder: Your ride from ${rideDetails.from} to ${rideDetails.to} is departing in ${hoursUntil} hours at ${rideDetails.time}. Meeting point: ${rideDetails.meetingPoint}. Have a safe journey!`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Reminder SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending reminder SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send route deviation alert SMS
     */
    static async sendDeviationAlert(phone, driverName, location) {
        const message = `⚠️ Route Deviation Alert: Driver ${driverName} has deviated from planned route. Current location: ${location}. Track live: ${process.env.BASE_URL}/tracking. Stay alert!`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Deviation alert SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending deviation SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send verification code for emergency contact
     */
    static async sendEmergencyContactVerification(phone, data) {
        const message = `Hi ${data.name}! ${data.userName} has added you as an emergency contact on LANE Carpool. Your verification code is: ${data.otp}. You will receive alerts only in case of emergency. This code expires in 10 minutes.`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Emergency contact verification SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending verification SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send admin alert for escalated emergencies
     */
    static async sendAdminAlert(phone, alertDetails) {
        const message = `🚨 ESCALATED SOS: ${alertDetails.userName} needs help! Time: ${alertDetails.timeElapsed}. Track: ${alertDetails.location}. Emergency ID: ${alertDetails.emergencyId}. Type: ${alertDetails.alertType}`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Admin alert SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending admin alert SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send booking accepted SMS notification
     */
    static async sendBookingAcceptedSMS(phone, riderName, bookingRef, seats) {
        const message = `✅ ${process.env.APP_NAME}: Your booking ${bookingRef} for ${seats} seat(s) has been ACCEPTED by ${riderName}! Check your email for details. Have a safe journey! 🚗`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Booking accepted SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending booking accepted SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send booking rejected SMS notification
     */
    static async sendBookingRejectedSMS(phone, riderName, bookingRef) {
        const message = `❌ ${process.env.APP_NAME}: Your booking ${bookingRef} has been declined by ${riderName}. Search for other rides at ${process.env.APP_URL || 'http://localhost:3000'}/rides/search`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ Booking rejected SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending booking rejected SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send generic SMS
     */
    static async sendSMS(phone, message) {
        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            console.log(`✅ SMS sent to ${phone}`);
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending SMS:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send location update SMS (during emergency)
     */
    static async sendLocationUpdate(phone, name, location, emergencyId) {
        const message = `Update: ${name} (Emergency #${emergencyId}) - Last seen at ${location}. Track live: ${process.env.BASE_URL}/emergency/track/${emergencyId}`;

        try {
            const result = await client.messages.create({
                body: message,
                from: twilioPhone,
                to: phone
            });
            return { success: true, messageId: result.sid };
        } catch (error) {
            console.error('❌ Error sending location update SMS:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = SMSService;
