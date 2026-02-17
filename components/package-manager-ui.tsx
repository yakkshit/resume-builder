"use client";

import React from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PackageStatus {
    sNo: number;
    name: string;
    status: "up-to-date" | "minor-update" | "major-update" | "deprecated";
    currentVersion: string;
    latestVersion: string;
}

const statusIcons = {
    "up-to-date": "🟢",
    "minor-update": "🍊",
    "major-update": "⚠️",
    "deprecated": "⛔",
};

interface PackageManagerUIProps {
    packages?: PackageStatus[];
}

export const PackageManagerUI: React.FC<PackageManagerUIProps> = ({ packages = [] }) => {
    return (
        <div className="p-4 border rounded-lg shadow-sm bg-background">
            <h2 className="text-xl font-bold mb-4">Package Manager Status</h2>
            <Table>
                <TableCaption>A list of project dependencies and their status.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">SNo</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Current Version</TableHead>
                        <TableHead>Suggestion</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {packages.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">No package data available</TableCell>
                        </TableRow>
                    ) : (
                        packages.map((pkg) => (
                            <TableRow key={pkg.name}>
                                <TableCell>{pkg.sNo}</TableCell>
                                <TableCell className="font-medium">{pkg.name}</TableCell>
                                <TableCell>{statusIcons[pkg.status]}</TableCell>
                                <TableCell>{pkg.currentVersion}</TableCell>
                                <TableCell>{pkg.latestVersion}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
