#include <errno.h>
#include <res_manager.h>
using namespace std;

int main(int argc, char** argv) {
  cout<<argc<<endl;
  cout<<argv[0]<<endl;
  cout<<argv[1]<<endl;

  if (argc<=1) {
    cout<<"Error from setFrontEndApp: Must provide pid";
    return -1;
  }

  int lockFd = open(LOCK_SYS_NOTIFICATION, O_RDWR | O_CREAT, 0666);
  if (lockFd == -1) {
    cout<<strerror(errno)<<endl;
    return -1;
  }

  lockf(lockFd, F_LOCK, 0);
  FILE * fd = fopen(NOTIFICATION, "a");
  fputs(argv[1], fd);
  fputs("\n", fd);
  fclose(fd);
  fd = NULL;
  lockf(lockFd, F_ULOCK, 0);
  close(lockFd);
  return 0;
}
