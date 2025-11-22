import { Outlet } from "react-router-dom";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import Header from "@/components/organisms/Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet />
      </main>
</div>
  );
}

export default Layout;