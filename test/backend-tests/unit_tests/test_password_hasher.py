from infrastructure.security.password_hasher import HashPassword


def test_hash_password_does_not_store_plaintext():
    password = "RebelReview123!"

    hashed = HashPassword.hash(password)

    assert hashed != password
    assert isinstance(hashed, str)


def test_verify_accepts_the_original_password():
    password = "RebelReview123!"
    hashed = HashPassword.hash(password)

    assert HashPassword.verify(password, hashed) is True


def test_verify_rejects_a_different_password():
    hashed = HashPassword.hash("RebelReview123!")

    assert HashPassword.verify("DifferentPassword123!", hashed) is False
