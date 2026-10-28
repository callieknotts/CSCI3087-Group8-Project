import bcrypt

class HashPassword:
    @staticmethod
    def hash(
        password:str
    ):
        pw=f'{password}'.encode()
        s= bcrypt.gensalt()
        h= bcrypt.hashpw(pw,s)
        return h.decode("utf-8")
    @staticmethod
    def verify(
        entered_pw,
        hashed_user_pw
    )->bool:
        return bcrypt.checkpw(entered_pw.encode('utf-8'),hashed_user_pw.encode('utf-8'))
        
        
        






    