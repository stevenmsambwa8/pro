import { supabase } from './supabase-client.js'
const { data: { session } } = await supabase.auth.getSession()

if (session) {
    window.location.replace('index'); 
}


const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

const validatePassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Must be at least 8 characters' }
    }

    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasLetter || !hasNumber) {
        return { valid: false, message: 'Must contain letters and numbers' }
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'~`]/.test(password)

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length

    if (strength === 2) {
        return { valid: true, message: 'Moderate strength', color: '#3db8ffff' }
    } else if (strength === 3) {
        return { valid: true, message: 'Strong password', color: '#2bc249ff' }
    } else {
        return { valid: true, message: 'Very strong password', color: '#00ff00ff' }
    }
}

const validateStageName = (name) => {
    const words = name.trim().split(/\s+/)
    return words.length <= 2 && name.trim().length > 0
}

const validateBio = (bio) => {
    const words = bio.trim().split(/\s+/)
    return words.length <= 4
}

// Realtime validation elements
const signupForm = document.querySelector('.signup')
const emailInput = signupForm.querySelector('input[type="text"][placeholder="Email*"]')
const passwordInput = signupForm.querySelector('input[type="password"][placeholder="Password *"]')
const repeatPasswordInput = signupForm.querySelector('input[type="password"][placeholder="Repeat password *"]')
const stageNameInput = signupForm.querySelector('input[placeholder="Stage name *"]')
const bioInput = document.getElementById('uDesc')
const uProgress = document.getElementById('uProgress')
const progressBar = document.querySelector('.progress')

// Create validation message elements
const createValidationMsg = (input, id) => {
    const msg = document.createElement('small')
    msg.id = id
    msg.style.cssText = 'display:block;margin-top:4px;font-size:12px;min-height:16px;'
    input.parentElement.appendChild(msg)
    return msg
}

const emailMsg = createValidationMsg(emailInput, 'emailMsg')
const passwordMsg = createValidationMsg(passwordInput, 'passwordMsg')
const repeatPasswordMsg = createValidationMsg(repeatPasswordInput, 'repeatPasswordMsg')
const stageNameMsg = createValidationMsg(stageNameInput, 'stageNameMsg')
const bioMsg = createValidationMsg(bioInput, 'bioMsg')

// Email validation
let emailCheckTimeout
emailInput.addEventListener('input', () => {
    const email = emailInput.value

    if (!email) {
        emailMsg.textContent = ''
        emailMsg.style.color = ''
        return
    }

    if (!validateEmail(email)) {
        emailMsg.textContent = 'Invalid email format'
        emailMsg.style.color = '#ff0000ff'
        return
    }

    emailMsg.textContent = 'Checking...'
    emailMsg.style.color = '#3db8ffff'

    clearTimeout(emailCheckTimeout)
    emailCheckTimeout = setTimeout(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single()

        if (data) {
            emailMsg.textContent = 'Email already exists'
            emailMsg.style.color = '#ff0000ff'
        } else {
            emailMsg.textContent = 'Email available'
            emailMsg.style.color = '#36dd57ff'
        }
    }, 500)
})

// Password validation
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value

    if (!password) {
        passwordMsg.textContent = ''
        return
    }

    const result = validatePassword(password)
    passwordMsg.textContent = result.message
    passwordMsg.style.color = result.valid ? (result.color || '#2bc249ff') : '#ff0000ff'

    if (repeatPasswordInput.value) {
        checkPasswordMatch()
    }
})

// Repeat password validation
const checkPasswordMatch = () => {
    const password = passwordInput.value
    const repeatPassword = repeatPasswordInput.value

    if (!repeatPassword) {
        repeatPasswordMsg.textContent = ''
        return
    }

    if (password !== repeatPassword) {
        repeatPasswordMsg.textContent = 'Passwords do not match'
        repeatPasswordMsg.style.color = '#ff0000ff'
    } else {
        repeatPasswordMsg.textContent = 'Passwords match'
        repeatPasswordMsg.style.color = '#26a740ff'
    }
}

repeatPasswordInput.addEventListener('input', checkPasswordMatch)

// Stage name validation with database check
let stageNameCheckTimeout
stageNameInput.addEventListener('input', () => {
    const stageName = stageNameInput.value.trim()

    if (!stageName) {
        stageNameMsg.textContent = ''
        return
    }

    if (!validateStageName(stageName)) {
        stageNameMsg.textContent = 'Stage name must be maximum 2 words'
        stageNameMsg.style.color = '#ff0000ff'
        return
    }

    stageNameMsg.textContent = 'Checking availability...'
    stageNameMsg.style.color = '#3db8ffff'

    clearTimeout(stageNameCheckTimeout)
    stageNameCheckTimeout = setTimeout(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('stage_name')
            .eq('stage_name', stageName)
            .single()

        if (data) {
            stageNameMsg.textContent = 'Stage name already taken'
            stageNameMsg.style.color = '#ff0000ff'
        } else {
            stageNameMsg.textContent = 'Available'
            stageNameMsg.style.color = '#6bcf7f'
        }
    }, 500)
})

// Bio validation
bioInput.addEventListener('input', () => {
    const bio = bioInput.value.trim()

    if (!bio) {
        bioMsg.textContent = ''
        return
    }

    if (!validateBio(bio)) {
        const wordCount = bio.split(/\s+/).length
        bioMsg.textContent = `Bio must be maximum 4 words (currently ${wordCount})`
        bioMsg.style.color = '#ff6b6b'
    } else {
        const wordCount = bio.split(/\s+/).length
        bioMsg.textContent = `${wordCount}/4 words`
        bioMsg.style.color = '#6bcf7f'
    }
})

// Compress image to target size (~90KB)
async function compressImage(file, targetSizeKB = 90) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const reader = new FileReader()

        reader.onerror = () => reject(new Error('Failed to read file'))
        
        reader.onload = (e) => {
            img.src = e.target.result
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // Resize to max 800px on longest side
            const maxDimension = 800
            let width = img.width
            let height = img.height

            if (width > height && width > maxDimension) {
                height = (maxDimension / width) * height
                width = maxDimension
            } else if (height > maxDimension) {
                width = (maxDimension / height) * width
                height = maxDimension
            }

            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            let quality = 0.9
            const targetBytes = targetSizeKB * 1024

            function attemptCompression() {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }

                        // If within target size or quality too low, accept result
                        if (blob.size <= targetBytes || quality <= 0.1) {
                            resolve(blob)
                        } else {
                            // Reduce quality and try again
                            quality -= 0.05
                            attemptCompression()
                        }
                    },
                    'image/jpeg',
                    quality
                )
            }

            attemptCompression()
        }

        reader.readAsDataURL(file)
    })
}

// Signup Form Handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = emailInput.value
    const password = passwordInput.value
    const repeatPassword = repeatPasswordInput.value
    const stageName = stageNameInput.value.trim()
    const userType = signupForm.querySelector('select').value
    const coverFile = document.getElementById('uCover').files[0]
    const bio = bioInput.value.trim()

    // Final validation
    if (!validateEmail(email)) {
        alert('Please enter a valid email address')
        return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
        alert(passwordValidation.message)
        return
    }

    if (password !== repeatPassword) {
        alert('Passwords do not match')
        return
    }

    if (!validateStageName(stageName)) {
        alert('Stage name must be maximum 2 words')
        return
    }

    if (bio && !validateBio(bio)) {
        alert('Bio must be maximum 4 words')
        return
    }

    if (userType === 'Who are you?') {
        alert('Please select your role')
        return
    }

    try {
        progressBar.style.display = 'block'
        uProgress.style.width = '30%'

        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/index',
                data: {
                    stage_name: stageName,
                    user_type: userType,
                    bio: bio
                }
            }
        })

        if (authError) throw authError

        uProgress.style.width = '60%'

        // Upload compressed profile picture if provided
        let coverUrl = null
        if (coverFile) {
            try {
                // Compress image to ~90KB
                const compressedBlob = await compressImage(coverFile, 90)
                
                const fileExt = 'jpg' // Always use jpg after compression
                const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('profiles')
                    .upload(fileName, compressedBlob, {
                        contentType: 'image/jpeg',
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    alert('Warning: Profile picture upload failed, but account was created')
                } else {
                    const { data: urlData } = supabase.storage
                        .from('profiles')
                        .getPublicUrl(fileName)
                    coverUrl = urlData.publicUrl
                }
            } catch (compressionError) {
                console.error('Compression error:', compressionError)
                alert('Warning: Profile picture could not be processed, but account was created')
            }
        }

        uProgress.style.width = '80%'

        // Store user data in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
                stage_name: stageName,
                user_type: userType,
                bio: bio,
                profile_picture: coverUrl,
                created_at: new Date().toISOString()
            })

        if (profileError) throw profileError

        uProgress.style.width = '100%'

        // Redirect to index
        window.location.href = 'index'

    } catch (error) {
        console.error('Signup error:', error)
        alert(error.message || 'Error creating account. Please try again.')
        progressBar.style.display = 'none'
    }
})

// Login Form Handler
const loginForm = document.getElementById('loginForm')
const loginMessage = document.getElementById('loginMessage')
const loginEmailInput = document.getElementById('loginEmail')
const loginPasswordInput = document.getElementById('loginPassword')

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const emailOrStageName = loginEmailInput.value.trim()
    const password = loginPasswordInput.value

    if (!emailOrStageName) {
        loginMessage.textContent = 'Please enter your email or stage name'
        loginMessage.style.color = '#ff6b6b'
        return
    }

    try {
        loginMessage.textContent = 'Signing in...'
        loginMessage.style.color = '#3db8ffff'

        let actualEmail = emailOrStageName

        // If input is not an email, treat it as stage name and lookup email
        if (!validateEmail(emailOrStageName)) {
            const { data: profile, error: lookupError } = await supabase
                .from('profiles')
                .select('email')
                .eq('stage_name', emailOrStageName)
                .single()

            if (lookupError || !profile) {
                throw new Error('Stage name not found')
            }

            actualEmail = profile.email
        }

        // Sign in with email
        const { data, error } = await supabase.auth.signInWithPassword({
            email: actualEmail,
            password: password
        })

        if (error) throw error

        loginMessage.textContent = 'Success! Redirecting...'
        loginMessage.style.color = '#6bcf7f'

        // Redirect to index
        window.location.href = 'index'

    } catch (error) {
        console.error('Login error:', error)
        loginMessage.textContent = error.message || 'Invalid credentials'
        loginMessage.style.color = '#ff6b6b'
    }
})

// Cancel buttons
document.getElementById('uploadClose')?.addEventListener('click', () => {
    signupForm.reset()
    progressBar.style.display = 'none'
    emailMsg.textContent = ''
    passwordMsg.textContent = ''
    repeatPasswordMsg.textContent = ''
    stageNameMsg.textContent = ''
    bioMsg.textContent = ''
})

document.getElementById('loginClose')?.addEventListener('click', () => {
    loginForm.reset()
    loginMessage.textContent = ''
})

// Forgot password functionality
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink')
    const resetPasswordModal = document.getElementById('resetPasswordModal')
    const resetPasswordCancel = document.getElementById('resetPasswordCancel')
    const resetPasswordSubmit = document.getElementById('resetPasswordSubmit')
    const resetPasswordEmailInput = document.getElementById('resetPasswordEmail')
    const resetPasswordMessage = document.getElementById('resetPasswordMessage')

    forgotPasswordLink?.addEventListener('click', function(e) {
        e.preventDefault()
        resetPasswordModal.style.display = 'block'
    })

    resetPasswordCancel?.addEventListener('click', function() {
        resetPasswordModal.style.display = 'none'
        resetPasswordMessage.textContent = ''
        resetPasswordEmailInput.value = ''
    })

    resetPasswordSubmit?.addEventListener('click', async function() {
        const email = resetPasswordEmailInput.value

        if (!email) {
            resetPasswordMessage.textContent = 'Please enter your email address.'
            resetPasswordMessage.style.color = '#ff6b6b'
            return
        }

        resetPasswordMessage.textContent = 'Sending reset password link...'
        resetPasswordMessage.style.color = '#ffd93d'

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            })

            if (error) {
                throw error
            }

            resetPasswordMessage.textContent = 'Password reset link sent to your email.'
            resetPasswordMessage.style.color = '#6bcf7f'
        } catch (error) {
            console.error('Reset password error:', error)
            resetPasswordMessage.textContent = error.message || 'Failed to send reset password link. Make sure that the email is registered.'
            resetPasswordMessage.style.color = '#ff6b6b'
        }
    })
})
