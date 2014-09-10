#include <errno.h>
#include <sys/stat.h>
#include <res_manager.h>
using namespace std;

int main() {
  FILE *fd, *fdOut;
  int retv;
  struct stat buf;

  int lockFd = open(LOCK_SYS_NOTIFICATION, O_RDWR | O_CREAT, 0666);
  if (lockFd == -1) {
    cout<<strerror(errno)<<endl;
    return -1;
  }

  lockf(lockFd, F_LOCK, 0);
  retv = stat(NOTIFICATION_C, &buf);
  if (retv == -1) {
    return -1;
  }
  if (buf.st_size == 0) {
    return 0;
  }
  char myString[100];
  fd = fopen(NOTIFICATION_C, "r+");
  fdOut = fopen(NOTIFICATION_JS, "w");
  if (fd == NULL || fdOut == NULL) perror("Error opening file");
  else {
    while (fgets(myString, 100, fd) != NULL) {
      //puts(myString);
      fputs(myString, fdOut);
    }
    fclose(fd);
    fclose(fdOut);
    fd = NULL;
    fdOut = NULL;
  }
  fd = fopen(NOTIFICATION_C, "w");
  if (fd == NULL) perror("Error opening file");
  fclose(fd);
  fd = NULL;
  lockf(lockFd, F_ULOCK, 0);
  close(lockFd);
  return 0;
}

