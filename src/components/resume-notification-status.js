export function makeApiError(result = {}) {
  const error = new Error(result.message || 'Something went wrong. Please try again.');
  error.code = result.error;
  return error;
}

export function verificationRecovery(errorCode) {
  if (errorCode !== 'already_verified') return null;
  return {
    view: 'delivery',
    notice: 'Your email is already verified. Check or retry request delivery below.',
  };
}

export function notificationFeedback(status) {
  if (status === 'accepted') {
    return {
      view: 'submitted',
      notice: 'The request was accepted by the email service for delivery to Sang.',
    };
  }
  if (status === 'processing') {
    return {
      view: 'delivery',
      notice: 'The request is still being processed. You can check again shortly.',
    };
  }
  return {
    view: 'delivery',
    notice: 'The email service did not accept the request. You can retry sending it below.',
  };
}
