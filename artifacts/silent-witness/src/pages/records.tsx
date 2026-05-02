import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useListRecords, getListRecordsQueryKey, useGetRecordStats } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Registry() {
  const [filters, setFilters] = useState({
    eventType: "",
    evidenceType: "",
    qualityLevel: "",
    country: "",
  });

  const { data: stats, isLoading: statsLoading } = useGetRecordStats();
  
  const queryParams = {
    ...filters,
    // clear empty strings to undefined to omit from query
    eventType: filters.eventType || undefined,
    evidenceType: filters.evidenceType || undefined,
    qualityLevel: filters.qualityLevel || undefined,
    country: filters.country || undefined,
  };

  const { data: recordsData, isLoading: recordsLoading } = useListRecords(queryParams, {
    query: {
      queryKey: getListRecordsQueryKey(queryParams)
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" ? "" : value }));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-primary tracking-tight mb-2 flex items-center gap-3">
            <Database className="w-8 h-8" />
            Public Registry
          </h1>
          <p className="text-lg text-muted-foreground">
            A public ledger of timestamped evidence fingerprints.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Records</div>
              <div className="text-2xl font-serif text-primary mt-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.total || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Recent (30d)</div>
              <div className="text-2xl font-serif text-primary mt-1">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.recentCount || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-2">
            <CardContent className="p-4 flex gap-4 items-center h-full">
               <div className="text-sm text-muted-foreground">
                 <strong className="block text-foreground mb-1">Notice</strong>
                 No maps, no precise locations, no victim names, no accusations. Records show "Not publicly verified" unless cleared by a verified partner.
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border p-4 rounded-lg mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground w-full sm:w-auto">
            <Filter className="w-4 h-4" /> Filters
          </div>
          
          <div className="w-full sm:w-40">
             <Select value={filters.eventType || "all"} onValueChange={(v) => handleFilterChange('eventType', v)}>
               <SelectTrigger>
                 <SelectValue placeholder="Event Type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Events</SelectItem>
                 <SelectItem value="kidnapping">Kidnapping</SelectItem>
                 <SelectItem value="killing">Killing</SelectItem>
                 <SelectItem value="detention">Detention</SelectItem>
                 <SelectItem value="threat">Threat</SelectItem>
                 <SelectItem value="theft">Theft</SelectItem>
                 <SelectItem value="assault">Assault</SelectItem>
                 <SelectItem value="displacement">Displacement</SelectItem>
                 <SelectItem value="other">Other</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="w-full sm:w-40">
             <Select value={filters.evidenceType || "all"} onValueChange={(v) => handleFilterChange('evidenceType', v)}>
               <SelectTrigger>
                 <SelectValue placeholder="Evidence Type" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Evidence</SelectItem>
                 <SelectItem value="video">Video</SelectItem>
                 <SelectItem value="image">Image</SelectItem>
                 <SelectItem value="audio">Audio</SelectItem>
                 <SelectItem value="document">Document</SelectItem>
                 <SelectItem value="written_testimony">Written Testimony</SelectItem>
                 <SelectItem value="package">Package</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="w-full sm:w-40">
             <Select value={filters.qualityLevel || "all"} onValueChange={(v) => handleFilterChange('qualityLevel', v)}>
               <SelectTrigger>
                 <SelectValue placeholder="Quality Level" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Qualities</SelectItem>
                 <SelectItem value="A">Level A (Full)</SelectItem>
                 <SelectItem value="B">Level B (Standard)</SelectItem>
                 <SelectItem value="C">Level C (Minimal)</SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="w-full sm:w-40">
            <Input 
              placeholder="Country" 
              value={filters.country} 
              onChange={(e) => handleFilterChange('country', e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Evidence Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Hash (truncated)</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : recordsData?.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No records found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                recordsData?.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(record.createdAtUtc), "yyyy-MM-dd HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{record.eventType.replace('_', ' ')}</TableCell>
                    <TableCell className="capitalize">{record.evidenceType.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {[record.city, record.region, record.country].filter(Boolean).join(', ') || <span className="text-muted-foreground italic">Withheld</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {record.packageHash.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{record.qualityLevel}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground border-border">
                        Not publicly verified
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
