import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import {
  useListRecords,
  getListRecordsQueryKey,
  useGetRecordStats,
} from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Filter, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function Registry() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState({
    eventType: "",
    evidenceType: "",
    qualityLevel: "",
    country: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetRecordStats();

  const queryParams = {
    ...filters,
    eventType: filters.eventType || undefined,
    evidenceType: filters.evidenceType || undefined,
    qualityLevel: filters.qualityLevel || undefined,
    country: filters.country || undefined,
  };

  const { data: recordsData, isLoading: recordsLoading } = useListRecords(
    queryParams,
    {
      query: {
        queryKey: getListRecordsQueryKey(queryParams),
      },
    }
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === "all" ? "" : value }));
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
            <Database className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            Public Registry
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            A public ledger of timestamped evidence fingerprints.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Records
              </div>
              <div className="text-xl sm:text-2xl font-serif text-primary mt-1">
                {statsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  stats?.total || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Recent (24h)
              </div>
              <div className="text-xl sm:text-2xl font-serif text-primary mt-1">
                {statsLoading ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  stats?.recentCount || 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Notice: </strong>No maps,
                no precise locations, no victim names, no accusations. Records
                show "Not publicly verified" unless cleared by a verified
                partner.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg mb-6 sm:mb-8">
          <button
            className="w-full flex items-center justify-between p-3 sm:p-4 text-sm font-medium text-muted-foreground sm:cursor-default"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {Object.values(filters).some(Boolean) && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </span>
            <span className="sm:hidden text-xs">{showFilters ? "Hide" : "Show"}</span>
          </button>

          <div
            className={`px-3 pb-3 sm:px-4 sm:pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${
              showFilters ? "block" : "hidden sm:grid"
            }`}
          >
            <Select
              value={filters.eventType || "all"}
              onValueChange={(v) => handleFilterChange("eventType", v)}
            >
              <SelectTrigger data-testid="select-event-type">
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

            <Select
              value={filters.evidenceType || "all"}
              onValueChange={(v) => handleFilterChange("evidenceType", v)}
            >
              <SelectTrigger data-testid="select-evidence-type">
                <SelectValue placeholder="Evidence Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Evidence</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="written_testimony">
                  Written Testimony
                </SelectItem>
                <SelectItem value="package">Package</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.qualityLevel || "all"}
              onValueChange={(v) => handleFilterChange("qualityLevel", v)}
            >
              <SelectTrigger data-testid="select-quality-level">
                <SelectValue placeholder="Quality Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Qualities</SelectItem>
                <SelectItem value="A">Level A (Full)</SelectItem>
                <SelectItem value="B">Level B (Standard)</SelectItem>
                <SelectItem value="C">Level C (Minimal)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Country"
              value={filters.country}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              data-testid="input-filter-country"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="whitespace-nowrap">Hash</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full max-w-[80px]" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : recordsData?.records.length === 0
                  ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-muted-foreground"
                      >
                        No records found matching filters.
                      </TableCell>
                    </TableRow>
                  )
                  : recordsData?.records.map((record) => (
                      <TableRow
                        key={record.id}
                        data-testid={`row-record-${record.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/records/${record.packageHash}`)}
                      >
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            {format(
                              new Date(record.serverReceivedAtUtc),
                              "yyyy-MM-dd"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {record.eventType.replace("_", " ")}
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {record.evidenceType.replace("_", " ")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {[record.city, record.region, record.country]
                            .filter(Boolean)
                            .join(", ") || (
                            <span className="text-muted-foreground italic">
                              Withheld
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {record.packageHash.substring(0, 12)}…
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {record.qualityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-normal text-xs bg-muted text-muted-foreground whitespace-nowrap"
                          >
                            Not publicly verified
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden space-y-3">
          {recordsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-lg p-4 space-y-2"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            : recordsData?.records.length === 0
            ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No records found matching filters.
              </div>
            )
            : recordsData?.records.map((record) => (
                <div
                  key={record.id}
                  className="bg-card border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:border-primary/40 transition-colors"
                  data-testid={`card-record-${record.id}`}
                  onClick={() => navigate(`/records/${record.packageHash}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-medium text-sm capitalize">
                        {record.eventType.replace("_", " ")}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {record.evidenceType.replace("_", " ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="outline" className="font-mono text-xs">
                        {record.qualityLevel}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.serverReceivedAtUtc), "yyyy-MM-dd")}
                    </span>
                    {[record.city, record.region, record.country]
                      .filter(Boolean)
                      .length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[record.city, record.region, record.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-muted-foreground font-mono">
                      {record.packageHash.substring(0, 16)}…
                    </code>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-muted text-muted-foreground whitespace-nowrap"
                    >
                      Not verified
                    </Badge>
                  </div>
                </div>
              ))}
        </div>

        {/* Footer count */}
        {!recordsLoading && recordsData && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Showing {recordsData.records.length} of {recordsData.total} records
          </p>
        )}
      </div>
    </Layout>
  );
}
