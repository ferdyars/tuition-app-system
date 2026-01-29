export function successResponse<T>(data: T, statusCode = 200) {
  return Response.json(
    {
      success: true,
      data,
    },
    { status: statusCode },
  );
}

export function errorResponse(
  message: string,
  code: string,
  statusCode = 400,
  details?: unknown,
) {
  const error: { message: string; code: string; details?: unknown } = {
    message,
    code,
  };
  if (details !== undefined) {
    error.details = details;
  }

  return Response.json(
    {
      success: false,
      error,
    },
    { status: statusCode },
  );
}
