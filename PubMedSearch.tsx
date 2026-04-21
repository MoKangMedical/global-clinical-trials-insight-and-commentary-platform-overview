import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Download, ExternalLink, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PubMedSearch() {
  const [, setLocation] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [journal, setJournal] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data, isLoading, refetch } = trpc.pubmed.search.useQuery(
    {
      keyword: keyword || undefined,
      journal: journal || undefined,
      maxResults: 20
    },
    {
      enabled: searchTriggered
    }
  );

  const importMutation = trpc.pubmed.importTrial.useMutation({
    onSuccess: (result) => {
      toast.success("试验已成功导入！正在跳转到详情页...");
      setTimeout(() => {
        setLocation(`/trial/${result.trialId}`);
      }, 1000);
    },
    onError: (error) => {
      toast.error(`导入失败: ${error.message}`);
    }
  });

  const handleSearch = () => {
    setSearchTriggered(true);
    refetch();
  };

  const handleImport = (article: any) => {
    importMutation.mutate({
      pmid: article.pmid,
      title: article.title,
      abstract: article.abstractText || article.abstract,
      journal: article.journal,
      doi: article.doi,
      pmcId: article.pmcId,
      fullTextUrl: article.fullTextUrl,
      publicationDate: article.publicationDate
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">PubMed临床试验搜索</h1>
              <p className="text-sm text-muted-foreground mt-1">
                实时搜索2025年后发表的临床试验论文
              </p>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              返回主页
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>搜索参数</CardTitle>
            <CardDescription>
              输入关键词或期刊名称搜索PubMed数据库中2025年后发表的临床试验
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">关键词</label>
                <Input
                  placeholder="例如: diabetes, cancer, hypertension"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">期刊名称</label>
                <Input
                  placeholder="例如: NEJM, Lancet, JAMA"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      搜索中...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      搜索
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchTriggered && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">正在搜索PubMed数据库...</span>
              </div>
            ) : data && data.articles.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    搜索结果 ({data.totalCount} 篇论文)
                  </h2>
                  <Badge variant="secondary">
                    显示前 {data.articles.length} 篇
                  </Badge>
                </div>

                {data.articles.map((article: any) => (
                  <Card key={article.pmid} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{article.journal}</Badge>
                              <span className="text-muted-foreground">
                                {new Date(article.publicationDate).toLocaleDateString("zh-CN")}
                              </span>
                              <span className="text-muted-foreground">
                                PMID: {article.pmid}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {article.abstract}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleImport(article)}
                          disabled={importMutation.isPending}
                        >
                          {importMutation.isPending ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="mr-2 h-3 w-3" />
                          )}
                          一键分析
                        </Button>

                        {article.pdfUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(article.pdfUrl, "_blank")}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            下载PDF
                          </Button>
                        )}

                        {article.fullTextUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(article.fullTextUrl, "_blank")}
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            查看全文
                          </Button>
                        )}

                        {article.submissionUrl && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(article.submissionUrl, "_blank")}
                          >
                            <Send className="mr-2 h-3 w-3" />
                            期刊投稿
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    未找到符合条件的临床试验论文。请尝试调整搜索条件。
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!searchTriggered && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                输入搜索条件开始查找2025年后发表的临床试验论文
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
