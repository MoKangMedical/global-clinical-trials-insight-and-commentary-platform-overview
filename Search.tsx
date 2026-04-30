import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Search as SearchIcon, Filter, ArrowLeft, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function Search() {
  const [keyword, setKeyword] = useState("");
  const [journal, setJournal] = useState<string>("");
  const [phase, setPhase] = useState<string>("");
  const [indication, setIndication] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [hasSearched, setHasSearched] = useState(false);

  const { data: trials, isLoading, refetch } = trpc.trials.search.useQuery(
    {
      keyword: keyword || undefined,
      journal: journal || undefined,
      phase: phase as any,
      indication: indication || undefined,
      dateFrom,
      dateTo,
      limit: 50
    },
    { enabled: hasSearched }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    refetch();
  };

  const handleReset = () => {
    setKeyword("");
    setJournal("");
    setPhase("");
    setIndication("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setHasSearched(false);
  };

  const topJournals = [
    "New England Journal of Medicine",
    "The Lancet",
    "JAMA",
    "BMJ",
    "Annals of Internal Medicine"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">智能检索</h1>
          <p className="text-muted-foreground">按期刊、阶段、适应症、关键词等多维度筛选临床试验</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  {/* Keyword */}
                  <div className="space-y-2">
                    <Label htmlFor="keyword">关键词</Label>
                    <Input
                      id="keyword"
                      placeholder="试验名称、疾病等"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>

                  {/* Journal */}
                  <div className="space-y-2">
                    <Label htmlFor="journal">期刊</Label>
                    <Select value={journal} onValueChange={setJournal}>
                      <SelectTrigger id="journal">
                        <SelectValue placeholder="选择期刊" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部期刊</SelectItem>
                        {topJournals.map((j) => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phase */}
                  <div className="space-y-2">
                    <Label htmlFor="phase">试验阶段</Label>
                    <Select value={phase} onValueChange={setPhase}>
                      <SelectTrigger id="phase">
                        <SelectValue placeholder="选择阶段" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部阶段</SelectItem>
                        <SelectItem value="I">Phase I</SelectItem>
                        <SelectItem value="II">Phase II</SelectItem>
                        <SelectItem value="III">Phase III</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Indication */}
                  <div className="space-y-2">
                    <Label htmlFor="indication">适应症</Label>
                    <Input
                      id="indication"
                      placeholder="疾病或病症"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>发表日期范围</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "yyyy-MM-dd") : "开始"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "yyyy-MM-dd") : "结束"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button type="submit" className="w-full">
                      <SearchIcon className="w-4 h-4 mr-2" />
                      搜索
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
                      重置
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {!hasSearched ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">设置筛选条件并点击搜索</p>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : trials && trials.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    找到 <span className="font-semibold text-foreground">{trials.length}</span> 个试验
                  </p>
                </div>

                <div className="space-y-4">
                  {trials.map((trial) => (
                    <Link key={trial.id} href={`/trial/${trial.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/50">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex gap-2">
                              <Badge variant={
                                trial.trialPhase === "III" ? "default" :
                                trial.trialPhase === "II" ? "secondary" : "outline"
                              }>
                                Phase {trial.trialPhase}
                              </Badge>
                              <Badge variant="outline">{trial.journal}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(trial.publicationDate).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                          <CardTitle className="text-lg hover:text-primary transition-colors">
                            {trial.title}
                          </CardTitle>
                          {trial.authors && (
                            <CardDescription className="text-sm">
                              {trial.authors.split(',').slice(0, 3).join(', ')}
                              {trial.authors.split(',').length > 3 && ', et al.'}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {trial.indication && (
                              <div>
                                <span className="font-medium text-foreground">适应症：</span>
                                <span className="text-muted-foreground">{trial.indication}</span>
                              </div>
                            )}
                            {trial.sampleSize && (
                              <div>
                                <span className="font-medium text-foreground">样本量：</span>
                                <span className="text-muted-foreground">{trial.sampleSize} 例</span>
                              </div>
                            )}
                          </div>
                          {trial.keyResults && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                              {trial.keyResults}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">未找到符合条件的试验</p>
                  <p className="text-sm text-muted-foreground mt-2">尝试调整筛选条件</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
