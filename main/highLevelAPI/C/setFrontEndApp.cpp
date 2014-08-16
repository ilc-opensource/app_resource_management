#include <errno.h>
#include <res_manager.h>
using namespace std;

int main(int argc, char** argv) {
  if (argc<=1) {
    cout<<"Error from setFrontEndApp: Must provide pid";
    return -1;
  }

  int fd, retv;
  int lockFd = open(LOCK_SYS_FRONT_END_APP, O_RDWR | O_CREAT, 0666);
  if (lockFd == -1) {
    cout<<strerror(errno)<<endl;
    return -1;
  }

  fd = shm_open(SHM_NAME, O_RDWR | O_CREAT, 0666);
  if (fd < 0) {
    cout<<strerror(errno)<<endl;
    return -1;
  }
  retv = ftruncate(fd, sizeof(pid_t));
  if (retv == -1) {
    cout<<strerror(errno)<<endl;
    return -1;
  }
  pid_t* shareMemPtr = (pid_t *)mmap(NULL, sizeof(pid_t), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  if (shareMemPtr == MAP_FAILED) {
    cout<<strerror(errno)<<endl;
    return -1;
  }
  close(fd);

  lockf(lockFd, F_LOCK, 0);
  *shareMemPtr = atoi(argv[1]);
  lockf(lockFd, F_ULOCK, 0);
  close(lockFd);
  return 0;
}
