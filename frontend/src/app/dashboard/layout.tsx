import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "จัดการบัญชีและดูประวัติการแปลมังงะของคุณ",
    robots: {
        index: false,
        follow: false,
    },
};

export { default } from "./page";
