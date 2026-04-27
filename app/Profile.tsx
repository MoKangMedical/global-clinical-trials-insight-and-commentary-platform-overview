import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, FileText, Download, Calendar, User, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  
  const { data: comments, isLoading: commentsLoading } = trpc.comments.getMyComments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: exports, isLoading: exportsLoading } = trpc.exports.getMy.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("已退出登录");
      window.location.href = "/";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">登录后可查看个人信息</p>
            <a href={getLoginUrl()}>
              <Button>登录</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <div className="container py-8 max-w-6xl">
        {/* User Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{user?.name || "用户"}</CardTitle>
                  <CardDescription className="mt-1">
                    {user?.email || "未设置邮箱"}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                      {user?.role === "admin" ? "管理员" : 
                       user?.role === "researcher" ? "研究者" :
                       user?.role === "editor" ? "编辑" : "用户"}
                    </Badge>
                    <Badge variant="outline">
                      注册于 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="comments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments">
              <FileText className="w-4 h-4 mr-2" />
              我的评论 ({comments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="exports">
              <Download className="w-4 h-4 mr-2" />
              导出记录 ({exports?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments">
            {commentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">评论 #{comment.id}</CardTitle>
                            {comment.isEdited === 1 && (
                              <Badge variant="secondary">已编辑</Badge>
                            )}
                          </div>
                          <CardDescription>
                            试验 ID: {comment.trialId} · 
                            创建于 {new Date(comment.createdAt).toLocaleString('zh-CN')} · 
                            约 {comment.wordCount} 字
                          </CardDescription>
                        </div>
                        <Link href={`/trial/${comment.trialId}`}>
                          <Button variant="outline" size="sm">
                            查看试验
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {comment.editedText || comment.commentText}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">您还没有生成任何评论</p>
                  <Link href="/search">
                    <Button className="mt-4">浏览试验</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports">
            {exportsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : exports && exports.length > 0 ? (
              <div className="space-y-4">
                {exports.map((exp) => (
                  <Card key={exp.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            {exp.fileName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <Badge variant="outline" className="mr-2">
                              {exp.documentType.toUpperCase()}
                            </Badge>
                            导出于 {new Date(exp.createdAt).toLocaleString('zh-CN')}
                            {exp.trialId && ` · 试验 ID: ${exp.trialId}`}
                          </CardDescription>
                        </div>
                        <a href={exp.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            下载
                          </Button>
                        </a>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">您还没有导出任何文档</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
