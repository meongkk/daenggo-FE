const STATUS_MESSAGES = {
  400: '입력한 내용을 확인해주세요.',
  401: '로그인이 필요합니다.',
  403: '이 기능을 사용할 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '현재 상태에서는 요청을 처리할 수 없습니다.',
  500: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

export function getApiErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  if (!error.response) {
    return error.code === 'ERR_CANCELED'
      ? ''
      : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  return STATUS_MESSAGES[error.response.status] || fallback;
}
