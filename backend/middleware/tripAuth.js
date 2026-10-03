import tripModel from '../model/tripModel.js';

// Determine if authenticated user is the organizer or a confirmed trip participant
export const resolveTripRole = async (tripId, userId) => {
    try {
        const trip = await tripModel.findById(tripId);
        if (!trip) {
            return { errorStatus: 404, errorMessage: "Trip not found" };
        }

        const isOrganizer = trip.organizer.toString() === userId.toString();

        const participantEntry = trip.participants.find(
            (p) => p.user && p.user.toString() === userId.toString() && p.status === 'confirmed'
        );

        const isConfirmedParticipant = Boolean(participantEntry);

        return {
            trip,
            isOrganizer,
            isConfirmedParticipant,
            participantEntry
        };
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return { errorStatus: 404, errorMessage: "Trip not found" };
        }
        return { errorStatus: 500, errorMessage: error.message };
    }
};

// Require user to be either organizer or confirmed participant
export const requireTripMember = async (tripId, userId) => {
    const roleResult = await resolveTripRole(tripId, userId);
    if (roleResult.errorStatus) {
        return roleResult;
    }

    if (!roleResult.isOrganizer && !roleResult.isConfirmedParticipant) {
        return { errorStatus: 403, errorMessage: "Access denied. You are not a confirmed member of this trip." };
    }

    return roleResult;
};

// Require user to be the trip organizer
export const requireTripOrganizer = async (tripId, userId) => {
    const roleResult = await resolveTripRole(tripId, userId);
    if (roleResult.errorStatus) {
        return roleResult;
    }

    if (!roleResult.isOrganizer) {
        return { errorStatus: 403, errorMessage: "Access denied. Only the trip organizer can perform this action." };
    }

    return roleResult;
};

// Check if assigned user belongs to trip as organizer or confirmed member
export const validateParticipantOfTrip = (trip, assignedUserId) => {
    if (!assignedUserId) return true;
    if (trip.organizer.toString() === assignedUserId.toString()) return true;

    const isParticipant = trip.participants.some(
        (p) => p.user && p.user.toString() === assignedUserId.toString() && p.status === 'confirmed'
    );

    return isParticipant;
};
