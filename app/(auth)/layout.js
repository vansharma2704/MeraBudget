import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center px-4 pt-16 sm:pt-24 lg:pt-32">
      {children}
    </div>
  );
};

export default AuthLayout;
