import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Search, AlertTriangle, TrendingUp, FileText, Bell } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState("");
  
  const { data: trials, isLoading } = trpc.trials.getRecent.useQuery({ 
    limit: 20,
    year: 2026 // Only show 2026 trials
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to search page with keyword
    window.location.href = `/search?q=${encodeURIComponent(searchKeyword)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Clinical Trials Insight</h1>
                <p className="text-xs text-muted-foreground">全球临床试验追踪与评论平台</p>
              </div>
            </div>
            
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/pubmed">
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      PubMed
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button variant="ghost" size="sm">
                      <Search className="w-4 h-4 mr-2" />
                      检索
                    </Button>
                  </Link>
                  <Link href="/subscriptions">
                    <Button variant="ghost" size="sm">
                      <Bell className="w-4 h-4 mr-2" />
                      订阅
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      {user?.name || "我的"}
                    </Button>
                  </Link>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm">登录</Button>
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background border-b border-border">
        <div className="container py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              智能分析全球顶级期刊临床试验
            </h2>
            <p className="text-lg text-muted-foreground">
              自动追踪 NEJM、Lancet、JAMA、BMJ 等顶级期刊最新发表的临床试验，
              提供方法学漏洞分析与高质量评论生成
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="搜索试验、疾病、期刊或关键词..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                <Button type="submit" size="lg" className="px-8">
                  <Search className="w-5 h-5 mr-2" />
                  搜索
                </Button>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{trials?.length || 0}</div>
                <div className="text-sm text-muted-foreground">最新试验</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">5</div>
                <div className="text-sm text-muted-foreground">顶级期刊</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">24h</div>
                <div className="text-sm text-muted-foreground">自动更新</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Trials */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground">最新临床试验</h3>
              <p className="text-muted-foreground mt-1">近期发表的Ⅰ、Ⅱ、Ⅲ期临床试验成果</p>
            </div>
            <Link href="/search">
              <Button variant="outline">
                查看全部
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trials.map((trial) => (
                <Link key={trial.id} href={`/trial/${trial.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant={
                          trial.trialPhase === "III" ? "default" :
                          trial.trialPhase === "II" ? "secondary" : "outline"
                        }>
                          Phase {trial.trialPhase}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(trial.publicationDate).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-2 text-foreground">
                        {trial.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {trial.journal}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trial.indication && (
                          <div className="text-sm">
                            <span className="font-medium text-foreground">适应症：</span>
                            <span className="text-muted-foreground">{trial.indication}</span>
                          </div>
                        )}
                        {trial.sampleSize && (
                          <div className="text-sm">
                            <span className="font-medium text-foreground">样本量：</span>
                            <span className="text-muted-foreground">{trial.sampleSize} 例</span>
                          </div>
                        )}
                        {trial.keyResults && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {trial.keyResults}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无试验数据</p>
                <p className="text-sm text-muted-foreground mt-2">
                  系统将自动从顶级期刊抓取最新临床试验数据
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h3 className="text-2xl font-bold text-center text-foreground mb-12">平台核心功能</h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-3" />
                <CardTitle className="text-lg">智能提取</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自动提取试验设计、统计指标、关键结果等结构化信息
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
                <CardTitle className="text-lg">漏洞识别</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  识别方法学漏洞，按风险等级分类展示潜在问题
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <FileText className="w-10 h-10 text-secondary mb-3" />
                <CardTitle className="text-lg">评论生成</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自动生成500字结构化Correspondence评论初稿
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Bell className="w-10 h-10 text-accent mb-3" />
                <CardTitle className="text-lg">订阅通知</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  按疾病、阶段、期刊自定义订阅，及时获取最新试验
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 Clinical Trials Insight Platform. 全球临床试验追踪与评论平台</p>
            <p className="mt-2">数据来源：NEJM, Lancet, JAMA, BMJ, Annals of Internal Medicine</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
